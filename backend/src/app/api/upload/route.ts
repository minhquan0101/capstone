import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    console.log("Upload API called");
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      console.error("No file or file is string");
      return NextResponse.json({ message: "Không có file để upload" }, { status: 400 });
    }

    const fileObj = file as File;
    console.log(`File received: ${fileObj.name}, size: ${fileObj.size}, type: ${fileObj.type}`);
    
    // Kiểm tra loại file (chỉ cho phép ảnh)
    if (!fileObj.type.startsWith("image/")) {
      console.error(`Invalid file type: ${fileObj.type}`);
      return NextResponse.json({ message: "Chỉ cho phép upload file ảnh" }, { status: 400 });
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileObj.size > maxSize) {
      console.error(`File too large: ${fileObj.size} bytes`);
      return NextResponse.json({ message: "Kích thước file không được vượt quá 5MB" }, { status: 400 });
    }

    console.log("Reading file buffer...");
    const bytes = await fileObj.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`Buffer size: ${buffer.length} bytes`);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    console.log(`Upload directory: ${uploadsDir}`);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Lấy extension từ tên file hoặc từ MIME type
    const originalName = fileObj.name;
    const fileExt = originalName.split(".").pop()?.toLowerCase() || fileObj.type.split("/")[1] || "png";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    console.log(`Saving file to: ${filePath}`);

    await fs.writeFile(filePath, buffer);
    console.log(`File saved successfully: ${fileName}`);

    const url = `/uploads/${fileName}`;
    const res = NextResponse.json({ url }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res;
  } catch (error: any) {
    console.error("Upload image error:", error);
    const errorMessage = error?.message || "Lỗi server khi upload ảnh";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}


