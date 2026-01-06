import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { Post } from "@/models/Post";
import { requireAdmin } from "@/utils/auth";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}

// GET /api/posts?type=showbiz|blog&region=vn|asia|us_eu&section=news|photo
//          &featured=true|1&sort=new|views&limit=50&skip=0
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const sp = req.nextUrl.searchParams;

    const type = sp.get("type") || undefined; // showbiz | blog
    const region = sp.get("region") || undefined; // vn | asia | us_eu
    const section = sp.get("section") || undefined; // news | photo
    const featured = sp.get("featured"); // "1"/"true"
    const sortParam = sp.get("sort") || "new"; // new | views

    const limit = Math.min(parseInt(sp.get("limit") || "50", 10), 100);
    const skip = Math.max(parseInt(sp.get("skip") || "0", 10), 0);

    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (region) filter.region = region;
    if (section) filter.section = section;
    if (featured === "1" || featured === "true") filter.isFeatured = true;

    const sort: Record<string, 1 | -1> =
      sortParam === "views" ? { views: -1, createdAt: -1 } : { createdAt: -1 };

    const posts = await Post.find(filter)
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .lean();

    return withCors(NextResponse.json({ posts }, { status: 200 }));
  } catch (error) {
    console.error("Get posts error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const body = await req.json();

    const { title, content, type, imageUrl, summary, region, section, isFeatured } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { message: "Thiếu tiêu đề, nội dung hoặc loại bài" },
        { status: 400 }
      );
    }

    const payload: any = {
      title,
      content,
      type,
      imageUrl,
      summary: summary || "",
    };

    if (type === "showbiz") {
      payload.region = region || "vn";
      payload.section = section || "news";
      payload.isFeatured = !!isFeatured;
    }

    const post = await Post.create(payload);

    return withCors(NextResponse.json({ post }, { status: 201 }));
  } catch (error) {
    console.error("Create post error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}
