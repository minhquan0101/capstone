import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";


type RouteContext = {
  params: Promise<{ id: string }>;
};


export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error("Get event detail error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// PUT /api/events/[id] -> cập nhật sự kiện
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, location, date, price, imageUrl, isFeatured, isTrending } = body;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (date !== undefined) update.date = date ? new Date(date) : null;
    if (price !== undefined) update.price = price;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (isFeatured !== undefined) update.isFeatured = isFeatured === true;
    if (isTrending !== undefined) update.isTrending = isTrending === true;

    const event = await Event.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    const res = NextResponse.json({ event }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    return res;
  } catch (error) {
    console.error("Update event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const result = await Event.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    const res = NextResponse.json({ message: "Đã xoá sự kiện" }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    return res;
  } catch (error) {
    console.error("Delete event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  return res;
}


