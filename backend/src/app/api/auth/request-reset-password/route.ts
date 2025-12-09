import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";
import { sendResetPasswordEmail } from "@/utils/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Thiếu email" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return NextResponse.json(
        { message: "Nếu email tồn tại, mã xác minh đã được gửi." },
        { status: 200, headers: corsHeaders }
      );
    }

    // Sinh mã xác minh 6 số
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await user.save();

    // Gửi email chứa mã xác minh
    try {
      await sendResetPasswordEmail(user.email, verificationCode);
    } catch (err) {
      console.error("Send reset password email error", err);
    }

    return NextResponse.json(
      { message: "Nếu email tồn tại, mã xác minh đã được gửi." },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Request reset password error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

