import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

const getProvinces = async () => {
    const query = `
        SELECT gid AS id, prov_code, prov_namt AS name_th, prov_name AS name_en
        FROM public.th_province_4326
        ORDER BY prov_namt ASC;
    `;
    return await db.query(query);
};

const getAmphoes = async (provCode: string) => {
    const query = `
        SELECT gid AS id, amp_namt AS name_th, amp_name AS name_en,
               prov_namt, amp_code
        FROM public.th_amphoe_4326
        WHERE prov_code = $1
        ORDER BY amp_namt ASC;
    `;
    return await db.query(query, [provCode]);
};

const getTambons = async (provCode: string, ampCode: string) => {
    // ใช้ 2 หลักท้ายของ amp_code เพราะ tambon table ใช้ format ต่างจาก amphoe
    const shortAmpCode = ampCode.slice(-2);
    const query = `
        SELECT gid AS id, tam_code, tam_namt AS name_th, tam_name AS name_en
        FROM public.th_tambon_4326
        WHERE prov_code = $1 AND amp_code = $2
        ORDER BY tam_namt ASC;
    `;
    return await db.query(query, [provCode, shortAmpCode]);
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const provCode = searchParams.get('prov_code');
    const ampCode = searchParams.get('amp_code');

    try {
        let result;

        if (provCode && ampCode) {
            // ถ้าส่งมาครบทั้งคู่ ดึงตำบล
            result = await getTambons(provCode, ampCode);
        } else if (provCode) {
            // ถ้าส่งมาแค่จังหวัด ดึงอำเภอ
            result = await getAmphoes(provCode);
        } else {
            // ถ้าไม่ส่งอะไรมาเลย ดึงจังหวัดทั้งหมด
            result = await getProvinces();
        }

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}