import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";
import { User } from "@/models/User";
import { requireUser } from "@/utils/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function GET(req: NextRequest) {
  try {
    const userPayload = requireUser(req);
    if (userPayload instanceof NextResponse) {
      return NextResponse.json(
        { message: "Không có quyền truy cập" },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB();

    // Lấy thông tin user mới nhất từ database để đảm bảo role được cập nhật
    const user = await User.findById(userPayload.sub);
    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
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
    console.error("Get user info error", error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

