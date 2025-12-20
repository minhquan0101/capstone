import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { requireUser } from "@/utils/auth";
import { Booking } from "@/models/Booking";
import { Event } from "@/models/Event";
import { TicketType } from "@/models/TicketType";

const HOLD_MINUTES = 15;

// trả vé cho booking pending hết hạn
async function releaseExpiredBookings() {
  const now = new Date();

  const expired = await Booking.find({ status: "pending", expiresAt: { $lt: now } })
    .select("_id eventId quantity ticketTypeId")
    .lean();

  if (!expired.length) return;

  await Booking.updateMany(
    { _id: { $in: expired.map((b) => b._id) } },
    { $set: { status: "expired" } }
  );

  for (const b of expired) {
    // ✅ nếu booking thuộc hạng vé -> trả held về TicketType
    if (b.ticketTypeId) {
      await TicketType.updateOne(
        { _id: b.ticketTypeId, held: { $gte: b.quantity } },
        { $inc: { held: -b.quantity } }
      );
      continue;
    }

    // ✅ fallback: event không chia hạng -> trả held về Event
    await Event.updateOne(
      { _id: b.eventId, ticketsHeld: { $gte: b.quantity } },
      { $inc: { ticketsHeld: -b.quantity } }
    );
  }
}

// GET /api/bookings -> vé của user
export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    await releaseExpiredBookings();

    const bookings = await Booking.find({ userId: auth.sub })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Get bookings error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// POST /api/bookings -> tạo booking pending + giữ vé (theo TicketType nếu có)
export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const body = await req.json();

    const { eventId, ticketTypeId, quantity, paymentMethod } = body as {
      eventId?: string;
      ticketTypeId?: string;
      quantity?: number;
      paymentMethod?: "momo" | "credit_card" | "bank_transfer";
    };

    if (!eventId || !Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ message: "eventId không hợp lệ" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json({ message: "Số lượng vé không hợp lệ" }, { status: 400 });
    }

    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    // ✅ check event có chia hạng vé không
    const typeCount = await TicketType.countDocuments({ eventId });

    // Nếu có chia hạng vé mà không chọn ticketTypeId -> bắt buộc chọn
    if (typeCount > 0 && !ticketTypeId) {
      return NextResponse.json({ message: "Vui lòng chọn hạng vé" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    // =========================
    // ✅ CASE 1: Event có hạng vé
    // =========================
    if (ticketTypeId) {
      if (!Types.ObjectId.isValid(ticketTypeId)) {
        return NextResponse.json({ message: "ticketTypeId không hợp lệ" }, { status: 400 });
      }

      const type = await TicketType.findById(ticketTypeId).lean();
      if (!type) {
        return NextResponse.json({ message: "Không tìm thấy hạng vé" }, { status: 404 });
      }

      if (String(type.eventId) !== String(eventId)) {
        return NextResponse.json(
          { message: "Hạng vé không thuộc sự kiện này" },
          { status: 400 }
        );
      }

      // Atomic: chỉ giữ vé nếu còn đủ vé trong hạng đó
      const updatedType = await TicketType.findOneAndUpdate(
        {
          _id: ticketTypeId,
          $expr: {
            $lte: [
              {
                $add: [
                  { $ifNull: ["$sold", 0] },
                  { $ifNull: ["$held", 0] },
                  qty,
                ],
              },
              { $ifNull: ["$total", 0] },
            ],
          },
        },
        { $inc: { held: qty } },
        { new: true }
      ).lean();

      if (!updatedType) {
        return NextResponse.json({ message: "Không đủ vé ở hạng này" }, { status: 400 });
      }

      const unitPrice = Number(type.price ?? 0);

      const booking = await Booking.create({
        userId: auth.sub,
        eventId,
        eventTitle: event.title,

        ticketTypeId,
        ticketTypeName: type.name,

        quantity: qty,
        unitPrice,
        totalAmount: unitPrice * qty,

        paymentMethod: paymentMethod ?? "momo",
        status: "pending",
        expiresAt,
      });

      return NextResponse.json({ booking }, { status: 201 });
    }

    // =========================
    // ✅ CASE 2: Event không chia hạng vé (giữ theo Event như cũ)
    // =========================
    const unitPrice = Number(event.price ?? 0);

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $expr: {
          $lte: [
            {
              $add: [
                { $ifNull: ["$ticketsSold", 0] },
                { $ifNull: ["$ticketsHeld", 0] },
                qty,
              ],
            },
            { $ifNull: ["$ticketsTotal", 100] },
          ],
        },
      },
      { $inc: { ticketsHeld: qty } },
      { new: true }
    ).lean();

    if (!updatedEvent) {
      return NextResponse.json({ message: "Không đủ vé để đặt" }, { status: 400 });
    }

    const booking = await Booking.create({
      userId: auth.sub,
      eventId,
      eventTitle: event.title,
      quantity: qty,
      unitPrice,
      totalAmount: unitPrice * qty,
      paymentMethod: paymentMethod ?? "momo",
      status: "pending",
      expiresAt,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Create booking error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}
