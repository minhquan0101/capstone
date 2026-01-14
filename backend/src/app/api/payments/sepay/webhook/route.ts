import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { TicketType } from "@/models/TicketType";
import { SeatLock } from "@/models/SeatLock";
import { Event } from "@/models/Event";

/**
 * SePay gửi header:
 *   Authorization: Apikey <API_KEY_CUA_BAN>
 * Bạn đã set: ticketfast_sepay_secret_2026
 */
function isAuthorized(req: NextRequest) {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY || "";
  if (!expected) return false;

  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  // chấp nhận vài biến thể viết hoa/thường
  // chuẩn SePay: "Apikey <key>"
  const norm = auth.trim();

  if (norm.toLowerCase() === `apikey ${expected}`.toLowerCase()) return true;
  if (norm === `Apikey ${expected}`) return true;
  if (norm === `APIKEY ${expected}`) return true;

  return false;
}

function extractBookingIdFromContent(content: string) {
  // Bạn đang dùng: "BOOKING <24hex>"
  const m = content.match(/BOOKING\s+([0-9a-f]{24})/i);
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

export async function POST(req: NextRequest) {
  try {
    // ✅ verify API key
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    /**
     * SePay payload có thể khác tuỳ cấu hình.
     * Mình parse theo kiểu "best effort":
     * - content/description: nội dung chuyển khoản
     * - amount: số tiền
     * - transactionId: mã giao dịch (nếu có)
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
    ]);

    const bookingId = extractBookingIdFromContent(content);
    if (!bookingId) {
      // Không tìm thấy BOOKING <id> => bỏ qua (trả 200 để SePay khỏi retry)
      return NextResponse.json({ ok: true, ignored: true, reason: "no_booking_code" });
    }

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ ok: true, ignored: true, reason: "booking_not_found" });
    }

    // idempotent: nếu đã paid thì OK
    if (booking.status === "paid") {
      return NextResponse.json({ ok: true, bookingStatus: "paid" });
    }

    // chỉ auto-confirm cho pending
    if (booking.status !== "pending") {
      return NextResponse.json({ ok: true, ignored: true, reason: `status=${booking.status}` });
    }

    // check expire
    if (booking.expiresAt && booking.expiresAt.getTime() <= Date.now()) {
      booking.status = "expired";
      await booking.save();
      return NextResponse.json({ ok: true, ignored: true, reason: "booking_expired" });
    }

    // check amount khớp (nếu payload có amount)
    // Nếu amount=0 (không có trong payload) thì không chặn — nhưng thường SePay có amount
    const expectedAmount = Math.round(Number((booking as any).totalAmount || 0));
    if (amount > 0 && expectedAmount > 0 && Math.round(amount) !== expectedAmount) {
      // trả 200 nhưng không confirm để tránh confirm sai
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "amount_mismatch",
        expectedAmount,
        amount,
      });
    }

    // ✅ MARK PAID
    booking.status = "paid";

    // (optional) lưu trace nếu schema cho phép (nếu schema strict và không có field, Mongoose sẽ bỏ qua)
    (booking as any).paymentProvider = "sepay";
    if (transactionId) (booking as any).paymentRef = transactionId;

    await booking.save();

    // ✅ HELD -> SOLD (y hệt admin mark-paid)
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

    return NextResponse.json({ ok: true, bookingId, bookingStatus: "paid" });
  } catch (e: any) {
    // Trả 500 để SePay retry (vì bạn đã bật retry khi != 2xx)
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}

// (không bắt buộc cho webhook server-to-server, nhưng giữ cho sạch)
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
