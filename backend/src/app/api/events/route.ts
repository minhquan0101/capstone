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

function computeFromTicketTypes(event: any, ticketTypes: any[]) {
  let ticketsTotal = Number(event?.ticketsTotal ?? 0);
  let ticketsSold = Number(event?.ticketsSold ?? 0);
  let ticketsHeld = Number(event?.ticketsHeld ?? 0);
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

  return {
    eventComputed: {
      ...event,
      // backward: FE cũ dùng event.price -> cho nó là "giá từ"
      price: priceFrom,
      // field rõ nghĩa
      priceFrom,
      ticketsTotal,
      ticketsSold,
      ticketsHeld,
      ticketsRemaining,
    },
    tickets: {
      total: ticketsTotal,
      sold: ticketsSold,
      held: ticketsHeld,
      remaining: ticketsRemaining,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured") === "true";
    const trending = searchParams.get("trending") === "true";

    const query: any = {};
    if (featured) query.isFeatured = true;
    if (trending) query.isTrending = true;

    const events = await Event.find(query).sort({ date: 1, createdAt: -1 }).lean();

    const eventIds = events.map((e: any) => e._id);
    const types = await TicketType.find({ eventId: { $in: eventIds } }).lean();

    const byEvent = new Map<string, any[]>();
    for (const t of types) {
      const key = String(t.eventId);
      if (!byEvent.has(key)) byEvent.set(key, []);
      byEvent.get(key)!.push(t);
    }

    const eventsWithComputed = events.map((e: any) => {
      const ticketTypes = (byEvent.get(String(e._id)) || []).sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      const { eventComputed, tickets } = computeFromTicketTypes(e, ticketTypes);

      return {
        ...eventComputed,
        ticketTypes,
        tickets, // để FE muốn dùng cũng được
      };
    });

    return withCors(NextResponse.json({ events: eventsWithComputed }, { status: 200 }));
  } catch (error) {
    console.error("Get events error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    await connectDB();
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
    } = body;

    if (!title) {
      return withCors(
        NextResponse.json({ message: "Thiếu tiêu đề sự kiện" }, { status: 400 })
      );
    }

    // Clean and validate ticket types
    let cleanedTicketTypes: { name: string; price: number; total: number }[] = [];
    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      cleanedTicketTypes = ticketTypes
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

      if (cleanedTicketTypes.length === 0) {
        return withCors(
          NextResponse.json({ message: "ticketTypes không hợp lệ" }, { status: 400 })
        );
      }
    }

    // Compute derived values
    const computedTotal =
      cleanedTicketTypes.length > 0
        ? cleanedTicketTypes.reduce((s, x) => s + x.total, 0)
        : ticketsTotal !== undefined && Number.isFinite(Number(ticketsTotal))
          ? Number(ticketsTotal)
          : 0;

    const computedMinPrice =
      cleanedTicketTypes.length > 0
        ? cleanedTicketTypes.reduce((m, x) => Math.min(m, x.price), Infinity)
        : price !== undefined && Number.isFinite(Number(price))
          ? Number(price)
          : 0;

    const createdEvent = await Event.create({
      title,
      description,
      location,
      date: date ? new Date(date) : undefined,
      price: computedMinPrice,     // lưu "giá từ" (nếu có ticketTypes)
      imageUrl,
      isFeatured: isFeatured === true,
      isTrending: isTrending === true,
      ticketsTotal: computedTotal, // nếu có ticketTypes => là sum total
    });

    // Create ticket types if applicable
    if (cleanedTicketTypes.length > 0) {
      await TicketType.insertMany(
        cleanedTicketTypes.map((t) => ({
          eventId: createdEvent._id,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );
    }

    const createdTicketTypes = await TicketType.find({ eventId: createdEvent._id })
      .sort({ createdAt: 1 })
      .lean();

    const { eventComputed, tickets } = computeFromTicketTypes(createdEvent.toObject?.() ?? createdEvent, createdTicketTypes);

    return withCors(
      NextResponse.json(
        { event: eventComputed, ticketTypes: createdTicketTypes, tickets },
        { status: 201 }
      )
    );
  } catch (error) {
    console.error("Create event error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
