import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";
import { signAuthToken } from "@/utils/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Thiếu email hoặc mật khẩu" },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 400, headers: corsHeaders }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Chặn đăng nhập nếu chưa xác minh email
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          message:
            "Tài khoản chưa xác minh email. Vui lòng kiểm tra email để lấy mã xác minh.",
          requireEmailVerification: true,
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const token = signAuthToken(user);

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}