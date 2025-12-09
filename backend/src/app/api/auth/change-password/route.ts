import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";
import { requireUser } from "@/utils/auth";

 
export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth instanceof NextResponse) return auth;

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ message: "Thiếu mật khẩu cũ hoặc mới" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(auth.sub);
    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Mật khẩu hiện tại không đúng" }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const res = NextResponse.json({ message: "Đổi mật khẩu thành công" }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res;
  } catch (error) {
    console.error("Change password error", error);
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


