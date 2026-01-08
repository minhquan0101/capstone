import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { TicketType } from "@/models/TicketType";
import { SeatLock } from "@/models/SeatLock";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";

type Ctx = { params: Promise<{ id: string }> };

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const adminOrRes = requireAdmin(req);
    if (adminOrRes instanceof NextResponse) return withCors(adminOrRes);

    const { id } = await ctx.params;

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) {
      return withCors(NextResponse.json({ message: "Không tìm thấy booking" }, { status: 404 }));
    }

    if (booking.status === "paid") {
      return withCors(NextResponse.json({ message: "Đơn đã paid", booking }));
    }

    if (booking.status !== "pending") {
      return withCors(
        NextResponse.json(
          { message: `Không thể mark-paid (status=${booking.status})`, booking },
          { status: 400 }
        )
      );
    }

    if (booking.expiresAt && booking.expiresAt.getTime() <= Date.now()) {
      booking.status = "expired";
      await booking.save();
      return withCors(
        NextResponse.json({ message: "Booking hết hạn", booking }, { status: 400 })
      );
    }

    // ✅ Mark paid
    booking.status = "paid";
    await booking.save();

    // ✅ HELD -> SOLD
    if ((booking as any).mode === "seat") {
      await SeatLock.updateMany(
        { bookingId: booking._id, status: "held" },
        { $set: { status: "sold" } }
      );

      const countByType = new Map<string, number>();
      for (const it of (booking as any).seatItems || []) {
        const k = String(it.ticketTypeId);
        countByType.set(k, (countByType.get(k) || 0) + 1);
      }
      for (const [ticketTypeId, n] of countByType.entries()) {
        await TicketType.updateOne({ _id: ticketTypeId }, { $inc: { held: -n, sold: +n } });
      }
    } else {
      if ((booking as any).ticketTypeId) {
        await TicketType.updateOne(
          { _id: (booking as any).ticketTypeId },
          { $inc: { held: -(booking as any).quantity, sold: +(booking as any).quantity } }
        );
      } else {
        await Event.updateOne(
          { _id: (booking as any).eventId },
          { $inc: { ticketsHeld: -(booking as any).quantity, ticketsSold: +(booking as any).quantity } }
        );
      }
    }

    return withCors(NextResponse.json({ message: "OK", booking }));
  } catch (e: any) {
    return withCors(
      NextResponse.json({ message: e?.message || "Server error" }, { status: 500 })
    );
  }
}
