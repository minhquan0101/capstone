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
      // ✅ Preserve tags from original event
      tags: event?.tags || [],
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
    const tagsParam = searchParams.get("tags");

    // ✅ NEW: price filter + sort
    const priceMinParam = searchParams.get("priceMin");
    const priceMaxParam = searchParams.get("priceMax");
    const priceSort = (searchParams.get("priceSort") || "").toLowerCase(); // asc | desc

    const priceMin =
      priceMinParam !== null && priceMinParam !== "" ? Number(priceMinParam) : null;
    const priceMax =
      priceMaxParam !== null && priceMaxParam !== "" ? Number(priceMaxParam) : null;

    const hasPriceMin = priceMin !== null && Number.isFinite(priceMin);
    const hasPriceMax = priceMax !== null && Number.isFinite(priceMax);

    const query: any = {};
    if (featured) query.isFeatured = true;
    if (trending) query.isTrending = true;

    // ✅ Filter by tags: support multiple tags (comma-separated)
    if (tagsParam) {
      const tagsArray = tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (tagsArray.length > 0) {
        query.tags = { $in: tagsArray };
      }
    }

    // Default: newest first (giữ như cũ)
    const events = await Event.find(query).sort({ createdAt: -1 }).lean();

    // Debug: Log events with tags from database
    console.log("🔍 Backend: Events found:", events.length);
    events.forEach((e: any, idx: number) => {
      console.log(`  [${idx + 1}] "${e.title}":`, {
        hasTags: !!e.tags,
        tagsType: typeof e.tags,
        tagsIsArray: Array.isArray(e.tags),
        tagsValue: e.tags,
        tagsLength: Array.isArray(e.tags) ? e.tags.length : "not array",
        allKeys: Object.keys(e).filter((k) => k.includes("tag") || k === "tags"),
      });
    });

    const eventIds = events.map((e: any) => e._id);
    const types = await TicketType.find({ eventId: { $in: eventIds } }).lean();

    const byEvent = new Map<string, any[]>();
    for (const t of types) {
      const key = String(t.eventId);
      if (!byEvent.has(key)) byEvent.set(key, []);
      byEvent.get(key)!.push(t);
    }

    // ✅ Tính computed trước
    let eventsWithComputed = events.map((e: any) => {
      const ticketTypes = (byEvent.get(String(e._id)) || []).sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      const { eventComputed, tickets } = computeFromTicketTypes(e, ticketTypes);

      const tags =
        Array.isArray(eventComputed.tags) && eventComputed.tags.length > 0
          ? eventComputed.tags
          : Array.isArray(e.tags) && e.tags.length > 0
            ? e.tags
            : [];

      if (tags.length > 0) {
        console.log(`  ✅ "${e.title}" has tags:`, tags);
      } else {
        console.log(
          `  ⚠️ "${e.title}" has NO tags (eventComputed.tags:`,
          eventComputed.tags,
          `, e.tags:`,
          e.tags,
          `)`
        );
      }

      return {
        ...eventComputed,
        tags,
        ticketTypes,
        tickets,
      };
    });

    // ✅ NEW: Filter by priceFrom (min ticketTypes price, fallback event.price)
    if (hasPriceMin || hasPriceMax) {
      eventsWithComputed = eventsWithComputed.filter((ev: any) => {
        const p = Number(ev.priceFrom ?? ev.price ?? 0);
        if (!Number.isFinite(p)) return false;
        if (hasPriceMin && p < (priceMin as number)) return false;
        if (hasPriceMax && p > (priceMax as number)) return false;
        return true;
      });
    }

    // ✅ NEW: Sort by priceFrom asc/desc nếu client yêu cầu
    if (priceSort === "asc" || priceSort === "desc") {
      const dir = priceSort === "asc" ? 1 : -1;
      eventsWithComputed.sort((a: any, b: any) => {
        const pa = Number(a.priceFrom ?? a.price ?? 0);
        const pb = Number(b.priceFrom ?? b.price ?? 0);

        // sort price trước
        if (pa !== pb) return (pa - pb) * dir;

        // tie-break: newest first (giữ cảm giác như cũ)
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
    }

    return withCors(
      NextResponse.json({ events: eventsWithComputed }, { status: 200 })
    );
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
      tags,
    } = body;

    // Debug: Log tags received from frontend
    console.log("🔍 POST /api/events - Received tags:", {
      tagsFromBody: body.tags,
      tagsDestructured: tags,
      tagsType: typeof body.tags,
      tagsIsArray: Array.isArray(body.tags),
    });

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

    // Process tags: use destructured tags or body.tags, always set explicitly even if empty
    const processedTags =
      Array.isArray(tags) || Array.isArray(body.tags)
        ? (Array.isArray(tags) ? tags : body.tags || [])
            .filter((t: any) => typeof t === "string" && t.trim().length > 0)
            .map((t: any) => t.trim())
        : [];

    console.log("🔍 POST /api/events - Processed tags before saving:", processedTags);

    // Always explicitly set tags to ensure it's saved to database
    const eventData: any = {
      title,
      description,
      location,
      date: date ? new Date(date) : undefined,
      price: computedMinPrice, // lưu "giá từ" (nếu có ticketTypes)
      imageUrl,
      isFeatured: isFeatured === true,
      isTrending: isTrending === true,
      ticketsTotal: computedTotal, // nếu có ticketTypes => là sum total
      tags: processedTags, // Always set tags explicitly, even if empty array
    };

    const createdEvent = await Event.create(eventData);

    // ✅ Normalize createdEvent (Mongoose create() đôi khi trả về Doc | Doc[])
    const eventDoc = Array.isArray(createdEvent) ? createdEvent[0] : createdEvent;
    const eventId = eventDoc._id;

    // Debug: Verify tags were saved to database
    const savedEvent = await Event.findById(eventId).lean();
    console.log("✅ POST /api/events - Tags saved to database:", {
      eventId: eventId,
      eventTitle: eventDoc.title,
      tagsInDatabase: savedEvent?.tags,
      tagsType: typeof savedEvent?.tags,
      tagsIsArray: Array.isArray(savedEvent?.tags),
    });

    // Create ticket types if applicable
    if (cleanedTicketTypes.length > 0) {
      await TicketType.insertMany(
        cleanedTicketTypes.map((t) => ({
          eventId: eventId,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );
    }

    const createdTicketTypes = await TicketType.find({ eventId: eventId })
      .sort({ createdAt: 1 })
      .lean();

    // ✅ Use plain object for computeFromTicketTypes
    const eventPlain =
      typeof (eventDoc as any).toObject === "function"
        ? (eventDoc as any).toObject()
        : eventDoc;

    const { eventComputed, tickets } = computeFromTicketTypes(
      eventPlain,
      createdTicketTypes
    );

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
