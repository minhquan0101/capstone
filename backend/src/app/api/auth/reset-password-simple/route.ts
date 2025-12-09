import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { message: "Thiếu email, mã xác minh hoặc mật khẩu mới" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng với email này" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kiểm tra mã xác minh
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return NextResponse.json(
        { message: "Không có mã xác minh. Vui lòng yêu cầu gửi lại mã." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (user.emailVerificationExpires.getTime() < Date.now()) {
      return NextResponse.json(
        { message: "Mã xác minh đã hết hạn. Vui lòng yêu cầu gửi lại mã." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (user.emailVerificationCode !== code) {
      return NextResponse.json(
        { message: "Mã xác minh không đúng" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Đặt lại mật khẩu
    user.password = await bcrypt.hash(newPassword, 10);
    // Xóa mã xác minh sau khi đã sử dụng
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    return NextResponse.json(
      { message: "Đặt lại mật khẩu thành công" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Reset password error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}


