import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function withCors(res: NextResponse, methods = "GET, PUT, DELETE, OPTIONS") {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", methods);
  return res;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 }));
    }

    const inc = req.nextUrl.searchParams.get("inc") === "1";

    const post = inc
      ? await Post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean()
      : await Post.findById(id).lean();

    if (!post) {
      return withCors(NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 }));
    }

    return withCors(NextResponse.json({ post }, { status: 200 }));
  } catch (error) {
    console.error("Get post detail error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 }));
    }

    const body = await req.json();
    const allow = ["title", "content", "type", "imageUrl", "region", "section", "summary", "isFeatured"] as const;

    const update: any = {};
    for (const k of allow) if (k in body) update[k] = body[k];

    const post = await Post.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!post) {
      return withCors(NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 }));
    }

    return withCors(NextResponse.json({ post }, { status: 200 }));
  } catch (error) {
    console.error("Update post error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 }));
    }

    const post = await Post.findByIdAndDelete(id).lean();
    if (!post) {
      return withCors(NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 }));
    }

    return withCors(NextResponse.json({ message: "Xóa bài đăng thành công" }, { status: 200 }));
  } catch (error) {
    console.error("Delete post error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
