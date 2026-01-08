import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Booking } from "@/models/Booking";
import { requireUser } from "@/utils/auth";

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

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const userOrRes = requireUser(req);
    if (userOrRes instanceof NextResponse) return withCors(userOrRes);
    const user = userOrRes;

    const { id } = await ctx.params;

    await connectDB();

    const booking = await Booking.findOne({ _id: id, userId: user.sub }).lean();
    if (!booking) {
      return withCors(NextResponse.json({ message: "Không tìm thấy booking" }, { status: 404 }));
    }

    return withCors(NextResponse.json({ booking }));
  } catch (e: any) {
    return withCors(
      NextResponse.json({ message: e?.message || "Server error" }, { status: 500 })
    );
  }
}
