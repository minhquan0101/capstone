import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { SeatLock } from "@/models/SeatLock";
import { TicketType } from "@/models/TicketType";

type Ctx = { params: Promise<{ id: string }> };

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 }));
    }

    const now = new Date();

    // cleanup seat held hết hạn + trừ TicketType.held
    const expired = await SeatLock.find({
      eventId: id,
      status: "held",
      expiresAt: { $lte: now },
    }).lean();

    if (expired.length > 0) {
      const byType = new Map<string, number>();
      for (const l of expired) {
        const k = String(l.ticketTypeId);
        byType.set(k, (byType.get(k) || 0) + 1);
      }

      await SeatLock.deleteMany({ _id: { $in: expired.map((x) => x._id) } });

      for (const [ticketTypeId, count] of byType.entries()) {
        await TicketType.updateOne({ _id: ticketTypeId }, { $inc: { held: -count } });
      }
    }

    const locks = await SeatLock.find({
      eventId: id,
      $or: [{ status: "sold" }, { status: "held", expiresAt: { $gt: now } }],
    }).lean();

    const soldSeatIds: string[] = [];
    const heldSeatIds: string[] = [];

    for (const l of locks) {
      if (l.status === "sold") soldSeatIds.push(l.seatId);
      else heldSeatIds.push(l.seatId);
    }

    return withCors(NextResponse.json({ soldSeatIds, heldSeatIds }));
  } catch (e) {
    console.error(e);
    return withCors(NextResponse.json({ message: "Server error" }, { status: 500 }));
  }
}
