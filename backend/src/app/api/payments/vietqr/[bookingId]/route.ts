import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { requireUser } from "@/utils/auth";

type Ctx = { params: Promise<{ bookingId: string }> };

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    // ✅ requireUser trả về AuthPayload | NextResponse -> phải narrow
    const userOrRes = requireUser(req);
    if (userOrRes instanceof NextResponse) return withCors(userOrRes);
    const user = userOrRes;

    const { bookingId } = await ctx.params;

    await connectDB();

    // ✅ AuthPayload không có _id, id nằm ở sub
    const booking = await Booking.findOne({ _id: bookingId, userId: user.sub }).lean();

    if (!booking) {
      return withCors(NextResponse.json({ message: "Không tìm thấy booking" }, { status: 404 }));
    }

    if (booking.status !== "pending") {
      return withCors(
        NextResponse.json({ message: "Booking không còn pending", booking }, { status: 400 })
      );
    }

    if (booking.expiresAt && new Date(booking.expiresAt).getTime() <= Date.now()) {
      return withCors(NextResponse.json({ message: "Booking đã hết hạn" }, { status: 400 }));
    }

    const amount = Math.round(booking.totalAmount || 0);
    const addInfo = `BOOKING ${bookingId}`; // nội dung CK để admin đối soát

    const bankId = process.env.VQR_BANK_ID || "vietcombank";
    const accountNo = process.env.VQR_ACCOUNT_NO!;
    const accountName = process.env.VQR_ACCOUNT_NAME || "";
    const template = process.env.VQR_TEMPLATE || "compact2";

    // VietQR Quick Link (trả ảnh QR)
    const qrImageUrl =
      `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(
        accountNo
      )}-${encodeURIComponent(template)}.png` +
      `?amount=${encodeURIComponent(String(amount))}` +
      `&addInfo=${encodeURIComponent(addInfo)}` +
      `&accountName=${encodeURIComponent(accountName)}`;

    return withCors(
      NextResponse.json({
        bookingId: String(booking._id),
        amount,
        addInfo,
        receive: { bankId, accountNo, accountName, template },
        qrImageUrl,
        expiresAt: booking.expiresAt,
      })
    );
  } catch (e: any) {
    return withCors(
      NextResponse.json({ message: e?.message || "Server error" }, { status: 500 })
    );
  }
}
