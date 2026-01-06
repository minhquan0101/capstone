import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  return res;
}

// GET /api/posts/[id]?incView=1
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const incView = req.nextUrl.searchParams.get("incView");
    const shouldInc = incView === "1" || incView === "true";

    const post = shouldInc
      ? await Post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean()
      : await Post.findById(id).lean();

    if (!post) {
      return NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    return withCors(NextResponse.json({ post }, { status: 200 }));
  } catch (error) {
    console.error("Get post detail error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// PUT /api/posts/[id] (admin)
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
    const {
      title,
      content,
      type,
      imageUrl,
      summary,
      region,
      section,
      isFeatured,
    } = body;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (summary !== undefined) update.summary = summary;
    if (content !== undefined) update.content = content;
    if (type !== undefined) update.type = type;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;

    // showbiz fields
    if (region !== undefined) update.region = region;
    if (section !== undefined) update.section = section;
    if (isFeatured !== undefined) update.isFeatured = !!isFeatured;

    const post = await Post.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!post) {
      return NextResponse.json({ message: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    return withCors(NextResponse.json({ post }, { status: 200 }));
  } catch (error) {
    console.error("Update post error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] (admin)
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

    return withCors(NextResponse.json({ message: "Đã xoá bài đăng" }, { status: 200 }));
  } catch (error) {
    console.error("Delete post error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
