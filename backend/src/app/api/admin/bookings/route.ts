import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { requireAdmin } from "@/utils/auth";
import { Booking } from "@/models/Booking";
import { Event } from "@/models/Event";
import { TicketType } from "@/models/TicketType";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  try {
    const adminOrRes = requireAdmin(req);
    if (adminOrRes instanceof NextResponse) return withCors(adminOrRes);

    await connectDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || ""; // pending|paid|failed|cancelled|expired
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

    const filter: any = {};
    if (status) filter.status = status;

    const bookingsRaw = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const eventIds = Array.from(
      new Set(bookingsRaw.map((b: any) => String(b.eventId || "")).filter(Boolean))
    );
    const ticketTypeIds = Array.from(
      new Set(bookingsRaw.map((b: any) => String(b.ticketTypeId || "")).filter(Boolean))
    );

    const [events, ttypes] = await Promise.all([
      eventIds.length
        ? Event.find({ _id: { $in: eventIds } }).select({ title: 1 }).lean()
        : Promise.resolve([]),
      ticketTypeIds.length
        ? TicketType.find({ _id: { $in: ticketTypeIds } }).select({ name: 1 }).lean()
        : Promise.resolve([]),
    ]);

    const eventMap = new Map(events.map((e: any) => [String(e._id), e.title]));
    const ttMap = new Map(ttypes.map((t: any) => [String(t._id), t.name]));

    const enriched = bookingsRaw.map((b: any) => ({
      ...b,
      eventTitle: eventMap.get(String(b.eventId)) || "",
      ticketTypeName: b.ticketTypeId ? ttMap.get(String(b.ticketTypeId)) || "" : "",
    }));

    return withCors(NextResponse.json({ bookings: enriched }));
  } catch (e: any) {
    return withCors(
      NextResponse.json({ message: e?.message || "Server error" }, { status: 500 })
    );
  }
}
