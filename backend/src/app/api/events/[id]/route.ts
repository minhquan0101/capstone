import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";
import { TicketType } from "@/models/TicketType";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  return res;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    const ticketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    return withCors(NextResponse.json({ event, ticketTypes }, { status: 200 }));
  } catch (error) {
    console.error("Get event detail error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// PUT /api/events/[id] -> cập nhật sự kiện (+ ticketTypes)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      location,
      date,
      price,
      imageUrl,
      ticketsTotal,
      ticketTypes, // ✅ thêm
    } = body;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (date !== undefined) update.date = date ? new Date(date) : null;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;

    // ✅ Nếu admin gửi ticketTypes -> update theo hạng vé
    if (Array.isArray(ticketTypes)) {
      // validate ticketTypes
      const cleaned = ticketTypes
        .map((t: any) => ({
          name: String(t?.name || "").trim(),
          price: Number(t?.price),
          total: Number(t?.total),
        }))
        .filter(
          (t: any) =>
            t.name &&
            Number.isFinite(t.price) &&
            t.price >= 0 &&
            Number.isFinite(t.total) &&
            t.total >= 0
        );

      if (cleaned.length === 0) {
        return NextResponse.json(
          { message: "ticketTypes không hợp lệ (phải có name, price, total)" },
          { status: 400 }
        );
      }

      // ⚠️ tránh mất dữ liệu sold/held: không cho thay đổi khi đã có bán/giữ
      const existingTypes = await TicketType.find({ eventId: id }).lean();
      const hasSoldOrHeld = existingTypes.some(
        (t: any) => Number(t.sold ?? 0) > 0 || Number(t.held ?? 0) > 0
      );
      if (hasSoldOrHeld) {
        return NextResponse.json(
          {
            message:
              "Không thể thay đổi hạng vé vì sự kiện đã có vé bán/đang giữ. Hãy tạo sự kiện mới hoặc làm chức năng chỉnh từng hạng vé riêng.",
          },
          { status: 400 }
        );
      }

      // replace ticket types
      await TicketType.deleteMany({ eventId: id });
      await TicketType.insertMany(
        cleaned.map((t: any) => ({
          eventId: id,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );

      // ✅ tự tính lại tổng vé & giá hiển thị (minPrice)
      const computedTotal = cleaned.reduce((s: number, x: any) => s + x.total, 0);
      const minPrice = cleaned.reduce((m: number, x: any) => Math.min(m, x.price), Infinity);

      update.ticketsTotal = computedTotal;
      update.price = Number.isFinite(minPrice) ? minPrice : 0;
    } else {
      // ✅ Không dùng ticketTypes -> dùng price + ticketsTotal theo event như cũ
      if (price !== undefined) update.price = Number(price);

      if (ticketsTotal !== undefined) {
        const newTotal = Number(ticketsTotal);

        // optional: chặn giảm tổng vé thấp hơn sold+held
        const current = await Event.findById(id).select("ticketsSold ticketsHeld").lean();
        const sold = Number((current as any)?.ticketsSold ?? 0);
        const held = Number((current as any)?.ticketsHeld ?? 0);
        if (Number.isFinite(newTotal) && newTotal < sold + held) {
          return NextResponse.json(
            { message: "Tổng vé không được nhỏ hơn số vé đã bán/đang giữ" },
            { status: 400 }
          );
        }

        update.ticketsTotal = newTotal;
      }
    }

    const event = await Event.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    const updatedTicketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    return withCors(NextResponse.json({ event, ticketTypes: updatedTicketTypes }, { status: 200 }));
  } catch (error) {
    console.error("Update event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const result = await Event.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    // ✅ xoá luôn ticketTypes của event
    await TicketType.deleteMany({ eventId: id });

    return withCors(NextResponse.json({ message: "Đã xoá sự kiện" }, { status: 200 }));
  } catch (error) {
    console.error("Delete event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
