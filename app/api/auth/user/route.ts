import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Please login",
        },
        { status: 401 }
      );
    }

    // Return user data from session
    return NextResponse.json({
      success: true,
      data: {
        id: session.user.id,
        name: session.user.name,
        kode_pegawai: session.user.kode_pegawai,
        role: session.user.role,
        roleId: session.user.roleId,
        cabang_id: session.user.cabang_id,
      },
    });
  } catch (error) {
    console.error("Error getting user session:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}