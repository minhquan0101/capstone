import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { signAuthToken } from "@/utils/auth";
import { User } from "@/models/User";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Thiếu email hoặc mã xác minh" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Nếu đã xác minh trước đó → trả luôn token
    if (user.emailVerified) {
      const token = signAuthToken(user);
      return NextResponse.json(
        {
          message: "Email đã được xác minh trước đó.",
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 200, headers: corsHeaders }
      );
    }

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

    // OK → xác minh
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    const token = signAuthToken(user);

    return NextResponse.json(
      {
        message: "Xác minh email thành công.",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Verify email error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}