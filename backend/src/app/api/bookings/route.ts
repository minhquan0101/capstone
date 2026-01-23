import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { requireUser } from "@/utils/auth";
import { Booking } from "@/models/Booking";
import EventModel from "@/models/Event";
import { TicketType } from "@/models/TicketType";
import { SeatLock } from "@/models/SeatLock";

const HOLD_MINUTES = 15;

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

type SeatRequest = { seatId: string; ticketTypeId: string };

type ExpiredBookingLean = {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  quantity: number;
  ticketTypeId?: Types.ObjectId;
  mode?: "normal" | "seat";
  seatItems?: Array<{ seatId: string; ticketTypeId: Types.ObjectId }>;
};

function toObjectId(id: string, fieldName: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
  return new Types.ObjectId(id);
}

/** ✅ Check sự kiện đã diễn ra chưa */
function isEventEnded(event: any): boolean {
  const raw = event?.date;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

// trả vé/ghế cho booking pending hết hạn
async function releaseExpiredBookings() {
  const now = new Date();

  const expired = (await Booking.find({ status: "pending", expiresAt: { $lt: now } })
    .select("_id eventId quantity ticketTypeId seatItems mode")
    .lean()) as ExpiredBookingLean[];

  if (!expired.length) return;

  await Booking.updateMany(
    { _id: { $in: expired.map((b) => b._id) } },
    { $set: { status: "expired" } }
  );

  for (const b of expired) {
    const seatItems = Array.isArray(b.seatItems) ? b.seatItems : [];

    // ✅ SEAT MODE: trả ghế bằng SeatLock
    if (b.mode === "seat" || seatItems.length > 0) {
      const locks = await SeatLock.find({
        bookingId: b._id,
        status: "held",
      })
        .select("ticketTypeId")
        .lean();

      if (locks.length) {
        await SeatLock.deleteMany({ bookingId: b._id, status: "held" });

        const byType = new Map<string, number>();
        for (const l of locks as Array<{ ticketTypeId: Types.ObjectId }>) {
          const k = String(l.ticketTypeId);
          byType.set(k, (byType.get(k) || 0) + 1);
        }

        for (const [ticketTypeId, count] of byType.entries()) {
          await TicketType.updateOne(
            { _id: ticketTypeId, held: { $gte: count } },
            { $inc: { held: -count } }
          );
        }
      }

      continue;
    }

    // ✅ NORMAL MODE: trả held theo ticketTypeId nếu có
    if (b.ticketTypeId) {
      await TicketType.updateOne(
        { _id: b.ticketTypeId, held: { $gte: b.quantity } },
        { $inc: { held: -b.quantity } }
      );
      continue;
    }

    // ✅ fallback: event không chia hạng -> trả held về Event
    await EventModel.updateOne(
      { _id: b.eventId, ticketsHeld: { $gte: b.quantity } },
      { $inc: { ticketsHeld: -b.quantity } }
    );
  }
}

// GET /api/bookings -> vé của user
export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return withCors(auth);

    await connectDB();
    await releaseExpiredBookings();

    const bookings = await Booking.find({ userId: auth.sub })
      .sort({ createdAt: -1 })
      .lean();

    return withCors(NextResponse.json({ bookings }, { status: 200 }));
  } catch (error) {
    console.error("Get bookings error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return withCors(auth);

    await connectDB();

    const body = (await req.json()) as {
      eventId?: string;
      ticketTypeId?: string;
      quantity?: number;
      paymentMethod?: "momo" | "credit_card" | "bank_transfer";
      seats?: SeatRequest[];
    };

    const { eventId, ticketTypeId, quantity, paymentMethod } = body;
    const seats = Array.isArray(body.seats) ? body.seats : null;

    if (!eventId || !Types.ObjectId.isValid(eventId)) {
      return withCors(NextResponse.json({ message: "eventId không hợp lệ" }, { status: 400 }));
    }

    const event = await EventModel.findById(eventId).lean();
    if (!event) {
      return withCors(NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 }));
    }

    // ✅ CHẶN ĐẶT VÉ NẾU SỰ KIỆN ĐÃ DIỄN RA
    if (isEventEnded(event)) {
      return withCors(
        NextResponse.json({ message: "Sự kiện đã diễn ra, không thể đặt vé." }, { status: 400 })
      );
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    // =====================================================
    // ✅ SEAT MODE: chọn ghế
    // =====================================================
    if (seats && seats.length > 0) {
      // validate seats
      const seen = new Set<string>();
      for (const s of seats) {
        if (!s?.seatId || !s?.ticketTypeId) {
          return withCors(
            NextResponse.json({ message: "Thiếu seatId/ticketTypeId" }, { status: 400 })
          );
        }
        if (seen.has(s.seatId)) {
          return withCors(
            NextResponse.json({ message: `Ghế bị trùng: ${s.seatId}` }, { status: 400 })
          );
        }
        seen.add(s.seatId);

        if (!Types.ObjectId.isValid(s.ticketTypeId)) {
          return withCors(
            NextResponse.json({ message: "ticketTypeId không hợp lệ" }, { status: 400 })
          );
        }
      }

      // group count by ticketTypeId
      const countByType = new Map<string, number>();
      for (const s of seats) {
        const k = String(s.ticketTypeId);
        countByType.set(k, (countByType.get(k) || 0) + 1);
      }

      // verify ticket types belong to event
      const typeIds = [...countByType.keys()];
      const types = await TicketType.find({ _id: { $in: typeIds }, eventId }).lean();
      if (types.length !== typeIds.length) {
        return withCors(
          NextResponse.json({ message: "Có hạng vé không thuộc sự kiện" }, { status: 400 })
        );
      }

      const priceByType = new Map<string, number>();
      for (const t of types as Array<{ _id: Types.ObjectId; price: number }>) {
        priceByType.set(String(t._id), Number(t.price || 0));
      }

      // check seat lock (sold/held)
      const now = new Date();
      const locked = await SeatLock.find({
        eventId,
        seatId: { $in: seats.map((s) => s.seatId) },
        $or: [{ status: "sold" }, { status: "held", expiresAt: { $gt: now } }],
      })
        .select("seatId")
        .lean();

      if (locked.length > 0) {
        return withCors(
          NextResponse.json(
            {
              message: "Có ghế đã được chọn/đã bán",
              lockedSeatIds: locked.map((x: any) => x.seatId),
            },
            { status: 409 }
          )
        );
      }

      // 1) hold TicketType.held (atomic per type)
      const heldSucceeded: Array<{ ticketTypeId: string; qty: number }> = [];
      for (const [tid, qtyNeed] of countByType.entries()) {
        const updated = await TicketType.findOneAndUpdate(
          {
            _id: tid,
            eventId,
            $expr: {
              $lte: [
                { $add: [{ $ifNull: ["$sold", 0] }, { $ifNull: ["$held", 0] }, qtyNeed] },
                { $ifNull: ["$total", 0] },
              ],
            },
          },
          { $inc: { held: qtyNeed } },
          { new: true }
        ).lean();

        if (!updated) {
          // rollback held increments
          for (const x of heldSucceeded) {
            await TicketType.updateOne(
              { _id: x.ticketTypeId, held: { $gte: x.qty } },
              { $inc: { held: -x.qty } }
            );
          }
          return withCors(
            NextResponse.json({ message: "Không đủ vé ở một số hạng" }, { status: 400 })
          );
        }

        heldSucceeded.push({ ticketTypeId: tid, qty: qtyNeed });
      }

      // 2) create booking (✅ cast string -> ObjectId for strict TS)
      const seatItems: Array<{
        seatId: string;
        ticketTypeId: Types.ObjectId;
        unitPrice: number;
      }> = seats.map((s) => ({
        seatId: s.seatId,
        ticketTypeId: toObjectId(s.ticketTypeId, "ticketTypeId"),
        unitPrice: priceByType.get(String(s.ticketTypeId)) || 0,
      }));

      const totalAmount = seatItems.reduce<number>((sum, x) => sum + Number(x.unitPrice || 0), 0);

      const booking = await Booking.create({
        userId: toObjectId(String(auth.sub), "userId"),
        eventId: toObjectId(eventId, "eventId"),
        eventTitle: (event as any).title,

        quantity: seats.length,
        unitPrice: 0,
        totalAmount,

        paymentMethod: paymentMethod ?? "momo",
        status: "pending",
        expiresAt,

        mode: "seat",
        seatItems,
      } as any);

      // 3) lock seats
      try {
        const bookingId = (booking as any)._id as Types.ObjectId;

        await SeatLock.insertMany(
          seats.map((s) => ({
            eventId: new Types.ObjectId(eventId),
            seatId: s.seatId,
            ticketTypeId: new Types.ObjectId(s.ticketTypeId),
            bookingId, // ✅
            status: "held",
            expiresAt,
          }))
        );
      } catch (e: any) {
        const bookingId = (booking as any)._id as Types.ObjectId;

        await SeatLock.deleteMany({ bookingId, status: "held" });

        for (const x of heldSucceeded) {
          await TicketType.updateOne(
            { _id: x.ticketTypeId, held: { $gte: x.qty } },
            { $inc: { held: -x.qty } }
          );
        }

        await Booking.updateOne({ _id: bookingId }, { $set: { status: "expired" } });

        if (String(e?.code) === "11000") {
          return withCors(
            NextResponse.json({ message: "Ghế vừa bị người khác chọn" }, { status: 409 })
          );
        }
        throw e;
      }

      return withCors(NextResponse.json({ booking }, { status: 201 }));
    }

    // =====================================================
    // ✅ NORMAL MODE: booking theo quantity (code cũ)
    // =====================================================
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return withCors(NextResponse.json({ message: "Số lượng vé không hợp lệ" }, { status: 400 }));
    }

    const typeCount = await TicketType.countDocuments({ eventId });

    if (typeCount > 0 && !ticketTypeId) {
      return withCors(NextResponse.json({ message: "Vui lòng chọn hạng vé" }, { status: 400 }));
    }

    if (ticketTypeId) {
      if (!Types.ObjectId.isValid(ticketTypeId)) {
        return withCors(
          NextResponse.json({ message: "ticketTypeId không hợp lệ" }, { status: 400 })
        );
      }

      const type = await TicketType.findById(ticketTypeId).lean();
      if (!type) {
        return withCors(NextResponse.json({ message: "Không tìm thấy hạng vé" }, { status: 404 }));
      }

      if (String((type as any).eventId) !== String(eventId)) {
        return withCors(
          NextResponse.json({ message: "Hạng vé không thuộc sự kiện này" }, { status: 400 })
        );
      }

      const updatedType = await TicketType.findOneAndUpdate(
        {
          _id: ticketTypeId,
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ["$sold", 0] }, { $ifNull: ["$held", 0] }, qty] },
              { $ifNull: ["$total", 0] },
            ],
          },
        },
        { $inc: { held: qty } },
        { new: true }
      ).lean();

      if (!updatedType) {
        return withCors(NextResponse.json({ message: "Không đủ vé ở hạng này" }, { status: 400 }));
      }

      const unitPrice = Number((type as any).price ?? 0);

      const booking = await Booking.create({
        userId: toObjectId(String(auth.sub), "userId"),
        eventId: toObjectId(eventId, "eventId"),
        eventTitle: (event as any).title,

        ticketTypeId: toObjectId(ticketTypeId, "ticketTypeId"),
        ticketTypeName: (type as any).name,

        quantity: qty,
        unitPrice,
        totalAmount: unitPrice * qty,

        paymentMethod: paymentMethod ?? "momo",
        status: "pending",
        expiresAt,
      } as any);

      return withCors(NextResponse.json({ booking }, { status: 201 }));
    }

    // Event không chia hạng vé
    const unitPrice = Number((event as any).price ?? 0);

    const updatedEvent = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        $expr: {
          $lte: [
            { $add: [{ $ifNull: ["$ticketsSold", 0] }, { $ifNull: ["$ticketsHeld", 0] }, qty] },
            { $ifNull: ["$ticketsTotal", 100] },
          ],
        },
      },
      { $inc: { ticketsHeld: qty } },
      { new: true }
    ).lean();

    if (!updatedEvent) {
      return withCors(NextResponse.json({ message: "Không đủ vé để đặt" }, { status: 400 }));
    }

    const booking = await Booking.create({
      userId: toObjectId(String(auth.sub), "userId"),
      eventId: toObjectId(eventId, "eventId"),
      eventTitle: (event as any).title,
      quantity: qty,
      unitPrice,
      totalAmount: unitPrice * qty,
      paymentMethod: paymentMethod ?? "momo",
      status: "pending",
      expiresAt,
    } as any);

    return withCors(NextResponse.json({ booking }, { status: 201 }));
  } catch (error: any) {
    console.error("Create booking error", error);

    // nếu lỗi từ toObjectId
    if (typeof error?.message === "string" && error.message.includes("không hợp lệ")) {
      return withCors(NextResponse.json({ message: error.message }, { status: 400 }));
    }

    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}
