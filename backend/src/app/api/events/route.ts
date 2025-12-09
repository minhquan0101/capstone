import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";


export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ date: 1, createdAt: -1 }).lean();
    const res = NextResponse.json({ events }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Get events error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const body = await req.json();

    const { title, description, location, date, price, imageUrl } = body;

    if (!title) {
      return NextResponse.json({ message: "Thiếu tiêu đề sự kiện" }, { status: 400 });
    }

    const event = await Event.create({
      title,
      description,
      location,
      date: date ? new Date(date) : undefined,
      price,
      imageUrl,
    });

    const res = NextResponse.json({ event }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Create event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}


