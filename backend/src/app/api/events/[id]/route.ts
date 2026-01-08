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

function computeEventComputed(event: any, ticketTypes: any[]) {
  let ticketsTotal = Number(event?.ticketsTotal ?? 0);
  let ticketsSold = Number(event?.ticketsSold ?? 0);
  let ticketsHeld = Number(event?.ticketsHeld ?? 0);

  // event.price trong DB có thể là "giá từ" hoặc "giá đơn" tuỳ event
  let priceFrom = Number(event?.price ?? 0);

  if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
    ticketsTotal = ticketTypes.reduce((s, x) => s + Number(x?.total ?? 0), 0);
    ticketsSold = ticketTypes.reduce((s, x) => s + Number(x?.sold ?? 0), 0);
    ticketsHeld = ticketTypes.reduce((s, x) => s + Number(x?.held ?? 0), 0);

    const minPrice = ticketTypes.reduce(
      (m, x) => Math.min(m, Number(x?.price ?? Infinity)),
      Infinity
    );
    priceFrom = Number.isFinite(minPrice) ? minPrice : 0;
  }

  const ticketsRemaining = Math.max(0, ticketsTotal - ticketsSold - ticketsHeld);

  const eventComputed = {
    ...event,
    // ✅ Preserve tags from original event
    tags: event?.tags || [],
    // Giữ backward-compat: FE đang dùng event.price => để nó là "giá từ"
    price: priceFrom,
    // Field mới rõ nghĩa
    priceFrom,
    ticketsTotal,
    ticketsSold,
    ticketsHeld,
    ticketsRemaining,
  };

  return {
    eventComputed,
    tickets: {
      total: ticketsTotal,
      sold: ticketsSold,
      held: ticketsHeld,
      remaining: ticketsRemaining,
    },
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 })
      );
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return withCors(
        NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 })
      );
    }

    const ticketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    const { eventComputed, tickets } = computeEventComputed(event, ticketTypes);

    return withCors(
      NextResponse.json({ event: eventComputed, ticketTypes, tickets }, { status: 200 })
    );
  } catch (error) {
    console.error("Get event detail error", error);
    return withCors(
      NextResponse.json({ message: "Lỗi server" }, { status: 500 })
    );
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 })
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      location,
      date,
      price,
      imageUrl,
      isFeatured,
      isTrending,
      ticketsTotal,
      ticketTypes,
      tags,
    } = body;

    // Debug: Log tags received from frontend
    console.log("🔍 PUT /api/events/[id] - Received tags:", {
      eventId: id,
      tagsFromBody: body.tags,
      tagsDestructured: tags,
      tagsType: typeof body.tags,
      tagsIsArray: Array.isArray(body.tags),
    });

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (date !== undefined) update.date = date ? new Date(date) : null;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (isFeatured !== undefined) update.isFeatured = isFeatured === true;
    if (isTrending !== undefined) update.isTrending = isTrending === true;
    // Always handle tags - if provided, use it (even if empty array), otherwise keep existing
    // But ensure tags is always explicitly set when provided to ensure it's saved to database
    if (tags !== undefined || body.tags !== undefined) {
      const tagsToProcess = tags !== undefined ? tags : body.tags;
      const processedTags = Array.isArray(tagsToProcess) 
        ? tagsToProcess.filter((t: any) => typeof t === "string" && t.trim().length > 0).map((t: any) => t.trim())
        : [];
      // Explicitly set tags using $set to ensure MongoDB saves it even if empty array
      update.tags = processedTags;
      console.log("🔍 PUT /api/events/[id] - Processed tags before updating:", processedTags);
    }

    if (Array.isArray(ticketTypes)) {
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
        return withCors(
          NextResponse.json(
            { message: "ticketTypes không hợp lệ (phải có name, price, total)" },
            { status: 400 }
          )
        );
      }

      const existingTypes = await TicketType.find({ eventId: id }).lean();
      const hasSoldOrHeld = existingTypes.some(
        (t: any) => Number(t.sold ?? 0) > 0 || Number(t.held ?? 0) > 0
      );
      if (hasSoldOrHeld) {
        return withCors(
          NextResponse.json(
            {
              message:
                "Không thể thay đổi hạng vé vì sự kiện đã có vé bán/đang giữ. Hãy tạo sự kiện mới hoặc làm chức năng chỉnh từng hạng vé riêng.",
            },
            { status: 400 }
          )
        );
      }

      await TicketType.deleteMany({ eventId: id });
      await TicketType.insertMany(
        cleaned.map((t: any) => ({
          eventId: id,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );

      // Update Event.price và ticketsTotal để list hiển thị nhanh (nhưng GET/PUT vẫn aggregate lại cho chắc)
      const computedTotal = cleaned.reduce((s: number, x: any) => s + x.total, 0);
      const minPrice = cleaned.reduce((m: number, x: any) => Math.min(m, x.price), Infinity);

      update.ticketsTotal = computedTotal;
      update.price = Number.isFinite(minPrice) ? minPrice : 0;
    } else {
      // Nếu event đang có TicketType, không cho set price/ticketsTotal thủ công để tránh lệch
      const existingCount = await TicketType.countDocuments({ eventId: id });
      if (existingCount > 0 && (price !== undefined || ticketsTotal !== undefined)) {
        return withCors(
          NextResponse.json(
            {
              message:
                "Sự kiện đang dùng hạng vé (ticketTypes). Vui lòng chỉnh bằng ticketTypes, không chỉnh price/ticketsTotal trực tiếp.",
            },
            { status: 400 }
          )
        );
      }

      if (price !== undefined) update.price = Number(price);

      if (ticketsTotal !== undefined) {
        const newTotal = Number(ticketsTotal);
        const current = await Event.findById(id).select("ticketsSold ticketsHeld").lean();
        const sold = Number((current as any)?.ticketsSold ?? 0);
        const held = Number((current as any)?.ticketsHeld ?? 0);

        if (Number.isFinite(newTotal) && newTotal < sold + held) {
          return withCors(
            NextResponse.json(
              { message: "Tổng vé không được nhỏ hơn số vé đã bán/đang giữ" },
              { status: 400 }
            )
          );
        }
        update.ticketsTotal = newTotal;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedEvent) {
      return withCors(
        NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 })
      );
    }

    // Debug: Verify tags were saved to database
    console.log("✅ PUT /api/events/[id] - Tags saved to database:", {
      eventId: id,
      eventTitle: updatedEvent.title,
      tagsInDatabase: updatedEvent.tags,
      tagsType: typeof updatedEvent.tags,
      tagsIsArray: Array.isArray(updatedEvent.tags),
      updateObjectHadTags: 'tags' in update,
    });

    const updatedTicketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    const { eventComputed, tickets } = computeEventComputed(updatedEvent, updatedTicketTypes);

    return withCors(
      NextResponse.json(
        { event: eventComputed, ticketTypes: updatedTicketTypes, tickets },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Update event error", error);
    return withCors(
      NextResponse.json({ message: "Lỗi server" }, { status: 500 })
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 })
      );
    }

    const result = await Event.findByIdAndDelete(id).lean();
    if (!result) {
      return withCors(
        NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 })
      );
    }

    await TicketType.deleteMany({ eventId: id });

    return withCors(NextResponse.json({ message: "Đã xoá sự kiện" }, { status: 200 }));
  } catch (error) {
    console.error("Delete event error", error);
    return withCors(
      NextResponse.json({ message: "Lỗi server" }, { status: 500 })
    );
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
