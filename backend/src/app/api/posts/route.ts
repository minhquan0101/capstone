import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";
import type { SortOrder } from "mongoose";

function withCors(res: NextResponse, methods = "GET, POST, OPTIONS") {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", methods);
  return res;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const sp = req.nextUrl.searchParams;
    const type = sp.get("type"); // showbiz | blog
    const region = sp.get("region"); // vn | asia | us_eu
    const section = sp.get("section"); // news | photo
    const sortParam = sp.get("sort") || "new"; // new | views
    const limit = Math.min(parseInt(sp.get("limit") || "50", 10), 100);
    const skip = Math.max(parseInt(sp.get("skip") || "0", 10), 0);

    const filter: any = {};
    if (type) filter.type = type;

    // ✅ hỗ trợ data cũ chưa có field -> vẫn match
    // region filter: region hoặc chưa có region
    if (region) {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ region }, { region: { $exists: false } }] },
      ];
    }

    // section filter: section hoặc chưa có section
    if (section) {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ section }, { section: { $exists: false } }] },
      ];
    }

    // ✅ FIX lỗi TS: dùng SortOrder + "desc"
    const sort: Record<string, SortOrder> =
      sortParam === "views"
        ? { views: "desc", createdAt: "desc" }
        : { createdAt: "desc" };

    const posts = await Post.find(filter).sort(sort).skip(skip).limit(limit).lean();

    return withCors(NextResponse.json({ posts }, { status: 200 }));
  } catch (error) {
    console.error("Get posts error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return withCors(auth);

    await connectDB();

    const { title, content, type, imageUrl, region, section, summary, isFeatured } =
      await req.json();

    if (!title || !content || !type) {
      return withCors(
        NextResponse.json(
          { message: "Thiếu tiêu đề, nội dung hoặc loại bài" },
          { status: 400 }
        )
      );
    }

    const post = await Post.create({
      title,
      content,
      type,
      imageUrl,
      region,
      section,
      summary,
      isFeatured: !!isFeatured,
    });

    return withCors(NextResponse.json({ post }, { status: 201 }));
  } catch (error) {
    console.error("Create post error", error);
    return withCors(NextResponse.json({ message: "Lỗi server" }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
