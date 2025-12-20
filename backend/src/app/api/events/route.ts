import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";
import { TicketType } from "@/models/TicketType";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ date: 1, createdAt: -1 }).lean();

    // ✅ Lấy ticketTypes theo event
    const eventIds = events.map((e) => e._id);
    const types = await TicketType.find({ eventId: { $in: eventIds } }).lean();

    const byEvent = new Map<string, any[]>();
    for (const t of types) {
      const key = String(t.eventId);
      if (!byEvent.has(key)) byEvent.set(key, []);
      byEvent.get(key)!.push(t);
    }

    // ✅ Gắn ticketTypes vào event + tổng hợp lại số liệu để FE dùng
    const eventsWithTypes = events.map((e: any) => {
      const ticketTypes = byEvent.get(String(e._id)) || [];

      if (ticketTypes.length > 0) {
        const ticketsTotal = ticketTypes.reduce((s, x) => s + Number(x.total ?? 0), 0);
        const ticketsSold = ticketTypes.reduce((s, x) => s + Number(x.sold ?? 0), 0);
        const ticketsHeld = ticketTypes.reduce((s, x) => s + Number(x.held ?? 0), 0);
        const minPrice = ticketTypes.reduce(
          (m, x) => Math.min(m, Number(x.price ?? Infinity)),
          Infinity
        );

        return {
          ...e,
          ticketTypes,
          ticketsTotal,
          ticketsSold,
          ticketsHeld,
          price: Number.isFinite(minPrice) ? minPrice : e.price,
        };
      }

      return { ...e, ticketTypes };
    });

    return withCors(NextResponse.json({ events: eventsWithTypes }, { status: 200 }));
  } catch (error) {
    console.error("Get events error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const body = await req.json();

    const {
      title,
      description,
      location,
      date,
      price,
      imageUrl,
      ticketsTotal,
      ticketTypes, // ✅ nhận thêm hạng vé
    } = body;

    if (!title) {
      return NextResponse.json({ message: "Thiếu tiêu đề sự kiện" }, { status: 400 });
    }

    // ✅ nếu có ticketTypes thì chuẩn hoá dữ liệu
    let cleanedTicketTypes: { name: string; price: number; total: number }[] = [];
    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      cleanedTicketTypes = ticketTypes
        .map((t: any) => ({
          name: String(t.name || "").trim(),
          price: Number(t.price),
          total: Number(t.total),
        }))
        .filter(
          (t: any) =>
            t.name &&
            Number.isFinite(t.price) &&
            t.price >= 0 &&
            Number.isFinite(t.total) &&
            t.total >= 0
        );

      if (cleanedTicketTypes.length === 0) {
        return NextResponse.json({ message: "ticketTypes không hợp lệ" }, { status: 400 });
      }
    }

    // ✅ Nếu có ticketTypes -> tự tính ticketsTotal và price (minPrice)
    const computedTotal =
      cleanedTicketTypes.length > 0
        ? cleanedTicketTypes.reduce((s, x) => s + x.total, 0)
        : ticketsTotal !== undefined
          ? Number(ticketsTotal)
          : undefined;

    const computedMinPrice =
      cleanedTicketTypes.length > 0
        ? cleanedTicketTypes.reduce((m, x) => Math.min(m, x.price), Infinity)
        : price !== undefined
          ? Number(price)
          : undefined;

    const event = await Event.create({
      title,
      description,
      location,
      date: date ? new Date(date) : undefined,
      price: computedMinPrice,
      imageUrl,
      ticketsTotal: computedTotal,
      // ticketsSold, ticketsHeld default theo schema
    });

    // ✅ Tạo hạng vé theo event
    if (cleanedTicketTypes.length > 0) {
      await TicketType.insertMany(
        cleanedTicketTypes.map((t) => ({
          eventId: event._id,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );
    }

    return withCors(NextResponse.json({ event }, { status: 201 }));
  } catch (error) {
    console.error("Create event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
