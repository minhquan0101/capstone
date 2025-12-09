import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// POST /api/upload -> upload ảnh, trả về URL lưu trong thư mục public/uploads
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Không có file để upload" }, { status: 400 });
    }

    const bytes = await (file as File).arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = (file as File).type.split("/")[1] || "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    const res = NextResponse.json({ url }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Upload image error", error);
    return NextResponse.json({ message: "Lỗi server khi upload ảnh" }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}


