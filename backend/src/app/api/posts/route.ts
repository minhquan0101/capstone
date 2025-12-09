import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";

// GET /api/posts -> danh sách tất cả bài đăng (showbiz + blog)
export async function GET() {
  try {
    await connectDB();
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("Get posts error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// POST /api/posts -> tạo bài đăng (chỉ admin)
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const { title, content, type } = await req.json();
    if (!title || !content || !type) {
      return NextResponse.json({ message: "Thiếu tiêu đề, nội dung hoặc loại bài" }, { status: 400 });
    }

    const post = await Post.create({ title, content, type });

    const res = NextResponse.json({ post }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Create post error", error);
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


