//api/provinces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {db_local} from "@/lib/db";

export async function GET(req: Request) {
    try {
        const query = `
            SELECT 
                gid AS id, 
                prov_code, 
                prov_namt AS name_th, 
                prov_name AS name_en, 
                ST_AsGeoJSON(geom) AS geom
            FROM 
                public.th_province_4326
            ORDER BY prov_name ASC;
        `;
        
        const result = await db_local.query(query);
        return NextResponse.json(result.rows);
        
    } catch (error) {
        console.error("Error fetching provinces:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลจังหวัด" },
            { status: 500 }
        );
    }
}