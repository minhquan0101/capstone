import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/posts/[id] -> chi tiết 1 bài đăng
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const post = await Post.findById(id).lean();
    if (!post) {
      return NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error("Get post detail error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// PUT /api/posts/[id] -> cập nhật bài đăng (chỉ admin)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const { title, content, type } = await req.json();
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (type !== undefined) update.type = type;

    const post = await Post.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!post) {
      return NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    const res = NextResponse.json({ post }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    return res;
  } catch (error) {
    console.error("Update post error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] -> xoá bài đăng (chỉ admin)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const result = await Post.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    const res = NextResponse.json({ message: "Đã xoá bài đăng" }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    return res;
  } catch (error) {
    console.error("Delete post error", error);
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


