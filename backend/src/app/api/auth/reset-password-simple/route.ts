import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";

// DEMO: Đặt lại mật khẩu chỉ bằng email + mật khẩu mới (không gửi email, không token)
// POST /api/auth/reset-password-simple
export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: "Thiếu email hoặc mật khẩu mới" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng với email này" }, { status: 404 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const res = NextResponse.json({ message: "Đặt lại mật khẩu thành công" }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Reset password simple error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return res;
}


