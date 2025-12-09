import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { requireUser } from "@/utils/auth";


export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const body = await req.json();
    const { eventName, quantity, paymentMethod } = body;

    if (!eventName || !quantity || !paymentMethod) {
      return NextResponse.json({ message: "Thiếu thông tin đặt vé" }, { status: 400 });
    }

    const booking = await Booking.create({
      userId: auth.sub,
      eventName,
      quantity,
      paymentMethod,
      status: "paid", 
    });

    const res = NextResponse.json({ booking }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Create booking error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}


