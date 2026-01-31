import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { TicketType } from "@/models/TicketType";
import { SeatLock } from "@/models/SeatLock";
import { Event } from "@/models/Event";

// ✅ quan trọng để Mongoose chạy ổn (đặc biệt khi deploy)
export const runtime = "nodejs";

/**
 * SePay thường gửi header Authorization theo dạng API key.
 * Thực tế có thể gặp các biến thể:
 *  - "Apikey <KEY>"
 *  - "APIkey_<KEY>"
 *  - "apikey:<KEY>"
 *  - "apikey-<KEY>"
 */
function isAuthorized(req: NextRequest) {
  const expected = (process.env.SEPAY_WEBHOOK_API_KEY || "").trim();
  if (!expected) return false;

  const auth = (req.headers.get("authorization") || "").trim();
  // match: "apikey <key>" | "apikey_<key>" | "apikey:<key>" | "apikey-<key>"
  const m = auth.match(/^apikey[\s_:-]+(.+)$/i);
  if (!m) return false;

  return m[1].trim() === expected;
}

function extractBookingIdFromContent(content: string) {
  // tolerant: BOOKING <24hex> | BOOKING:<id> | BOOKING_<id> | BOOKING-<id>
  const m = content.match(/BOOKING[\s_:-]+([0-9a-f]{24})/i);
  return m ? m[1] : null;
}

function pickFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickFirstNumber(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function normalizeTransferType(x: string) {
  const s = (x || "").toLowerCase().trim();
  if (!s) return "";
  // phổ biến: "in", "out"
  if (s === "in" || s === "income" || s === "credit" || s === "receive") return "in";
  if (s === "out" || s === "expense" || s === "debit" || s === "send") return "out";
  return s;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ verify API key
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    /**
     * Payload SePay có thể khác tuỳ cấu hình.
     * Parse theo "best effort"
     */
    const content = pickFirstString(body, [
      "content",
      "description",
      "transactionContent",
      "remark",
      "note",
      "message",
    ]);

    const amount = pickFirstNumber(body, [
      "amount",
      "money",
      "transferAmount",
      "amountIn",
      "value",
    ]);

    const transactionId = pickFirstString(body, [
      "transactionId",
      "transId",
      "reference",
      "ref",
      "id",
      "tid",
      "referenceCode",
    ]);

    const transferTypeRaw = pickFirstString(body, [
      "transferType",
      "type",
      "direction",
    ]);
    const transferType = normalizeTransferType(transferTypeRaw);

    // Nếu payload có transferType => chỉ xử lý giao dịch tiền vào
    if (transferType && transferType !== "in") {
      return NextResponse.json({ ok: true, ignored: true, reason: `transferType=${transferType}` });
    }

    const bookingId = extractBookingIdFromContent(content);
    if (!bookingId) {
      // Không tìm thấy BOOKING <id> => bỏ qua (trả 200 để SePay khỏi retry)
      return NextResponse.json({ ok: true, ignored: true, reason: "no_booking_code" });
    }

    await connectDB();

    const now = new Date();

    /**
     * ✅ CHỐNG DOUBLE CONFIRM:
     * Chỉ 1 request được phép đổi trạng thái pending -> paid.
     * Các request khác (retry / gửi 2 lần) sẽ không update được => không trừ vé 2 lần.
     */
    const filter: any = {
      _id: bookingId,
      status: "pending",
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    };

    // nếu webhook có amount, buộc khớp tiền để tránh confirm sai
    if (amount > 0) {
      filter.totalAmount = Math.round(amount);
    }

    const update: any = {
      $set: {
        status: "paid",
        paidAt: now,
        paymentProvider: "sepay",
      },
    };
    if (transactionId) {
      update.$set.paymentRef = transactionId;
    }

    const booking = await Booking.findOneAndUpdate(filter, update, { new: true });

    if (!booking) {
      // đã paid rồi / hết hạn / lệch tiền / không tồn tại / không pending
      // trả 200 để SePay không retry vô hạn
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "already_processed_or_not_match",
        bookingId,
      });
    }

    // ✅ HELD -> SOLD (chỉ chạy khi vừa update pending -> paid thành công)
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
        if (n <= 0) continue;
        await TicketType.updateOne(
          { _id: ticketTypeId },
          { $inc: { held: -n, sold: +n } }
        );
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

    return NextResponse.json({ ok: true, bookingId, bookingStatus: "paid" });
  } catch (e: any) {
    // Bạn muốn SePay retry khi != 2xx
    // Bây giờ đã idempotent nên retry cũng không sợ double-sold nữa
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}

// (không bắt buộc cho webhook server-to-server, nhưng giữ cho sạch)
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
