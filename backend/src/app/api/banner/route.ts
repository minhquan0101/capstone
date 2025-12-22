import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Banner } from "@/models/Banner";
import { requireAdmin } from "@/utils/auth";

export async function GET() {
  try {
    await connectDB();
    // Lấy banner mới nhất
    const banner = await Banner.findOne().sort({ createdAt: -1 }).lean();
    const res = NextResponse.json({ banner: banner || null }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Get banner error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ message: "Thiếu đường dẫn ảnh banner" }, { status: 400 });
    }

    const banner = await Banner.create({ imageUrl });

    const res = NextResponse.json({ banner }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Create banner error", error);
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

