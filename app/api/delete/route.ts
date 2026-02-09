import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 1. ตรวจสอบว่าส่ง ID มาหรือไม่
    if (!id) {
        return NextResponse.json(
            { error: "ID is required" },
            { status: 400 }
        );
    }

    try {
        // 2. SQL สำหรับการ Soft Delete
        // ใช้ NOW() ของ PostgreSQL เพื่อบันทึกเวลาปัจจุบันลงใน deleted_at
        const query = `
            UPDATE public.report_data
            SET deleted_at = NOW()
            WHERE id = $1
            RETURNING id
        `;

        const result = await db.query(query, [id]);

        // 3. ตรวจสอบว่ามีข้อมูลถูกอัปเดตจริงไหม
        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Data not found or already deleted" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Deleted successfully",
            id: id
        });

    } catch (error: any) {
        console.error("Delete API Error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
