import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/utils/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Thiếu thông tin bắt buộc" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { message: "Email đã tồn tại" },
        { status: 400, headers: corsHeaders }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới, mặc định chưa xác minh email
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
      emailVerified: false,
    });

    // Sinh mã xác minh 6 số
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await user.save();

    // Gửi email chứa mã xác minh
    try {
      await sendVerificationEmail(user.email, verificationCode);
    } catch (err) {
      console.error("Send verification email error", err);
    }

    return NextResponse.json(
      {
        message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác minh.",
        requireEmailVerification: true,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
