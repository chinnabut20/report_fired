import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // 1. รับค่า Params
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const sub_district = searchParams.get('sub_district');
    const startDate = searchParams.get('startDate'); 
    const endDate = searchParams.get('endDate');
    const burntype = searchParams.get('burntype');      
    const burntypedes = searchParams.get('burntypedes'); 
    const status = searchParams.get('status'); 

    try {
        // 2. สร้างเงื่อนไข WHERE
        let conditions = ["deleted_at IS NULL"];
        let values: any[] = [];
        let pIndex = 1;

        if (province) { conditions.push(`province = $${pIndex++}`); values.push(province); }
        if (district) { conditions.push(`district = $${pIndex++}`); values.push(district); }
        if (sub_district) { conditions.push(`sub_district = $${pIndex++}`); values.push(sub_district); }
        
        if (burntype) { conditions.push(`burn_type = $${pIndex++}`); values.push(burntype); }
        if (burntypedes) { conditions.push(`burn_type_des = $${pIndex++}`); values.push(burntypedes); } 

        if (startDate && endDate) {
            conditions.push(`burn_date BETWEEN $${pIndex++} AND $${pIndex++}`);
            values.push(startDate, endDate);
        } else if (startDate) {
            conditions.push(`burn_date >= $${pIndex++}`);
            values.push(startDate);
        } else if (endDate) {
            conditions.push(`burn_date <= $${pIndex++}`);
            values.push(endDate);
        }

        if (status) {
            switch (status) {
                case 'รออนุมัติ': 
                    conditions.push(`(is_approve = false AND is_reject = false)`); 
                    break;
                case 'อนุมัติแล้วยังไม่รายงาน': 
                    conditions.push(`(is_approve = true AND is_reject = false AND (actual_burn = 0 OR actual_burn IS NULL))`); 
                    break;
                case 'อนุมัติรายงานผลแล้ว': 
                    conditions.push(`(is_approve = true AND is_reject = false AND actual_burn > 0)`); 
                    break;
                case 'ไม่อนุมัติ':
                    conditions.push(`(is_approve = false AND is_reject = true)`); 
                    break;
                case 'อนุมัติทั้งหมด': 
                    conditions.push(`(is_approve = true AND is_reject = false)`); 
                    break;
            }
        }

        const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

        // 3. Query SQL
        const query = `
            SELECT 
                id,
                title,
                firstname,
                lastname,
                phone,
                TO_CHAR(created_at, 'DD/MM/YYYY') AS created_at,
                province,
                district,
                sub_district,
                burn_type,
                burn_type_des,
                burn_area,
                latitude,
                longitude,
                
                CASE 
                    WHEN is_approve = true AND is_reject = false AND actual_burn > 0 THEN 'อนุมัติรายงานผลแล้ว'
                    WHEN is_approve = true AND is_reject = false AND (actual_burn = 0 OR actual_burn IS NULL) THEN 'อนุมัติแล้วยังไม่รายงาน'
                    WHEN is_approve = false AND is_reject = false THEN 'รออนุมัติ'
                    WHEN is_approve = false AND is_reject = true THEN 'ไม่อนุมัติ'
                    ELSE 'ไม่ทราบสถานะ'
                END AS status_text,

                approve_by_f_name,
                approve_by_l_name,
                approve_by,
                
                approve_burn,
                TO_CHAR(burn_date, 'DD/MM/YYYY') AS burn_date

            FROM public.report_data
            ${whereClause} 
            ORDER BY created_at DESC;
        `;

        const result = await db.query(query, values);

        const formattedData = result.rows.map((row: any) => ({
            id: row.id,
            
            // ข้อมูลผู้ส่งคำร้อง
            "คำนำหน้า": row.title,                
            "ชื่อ": row.firstname,       
            "นามสกุล": row.lastname,         
            "เบอร์โทรศัพท์": row.phone,                
            "วันที่ส่งคำร้อง": row.created_at,   

            // ข้อมูลพื้นที่
            "จังหวัด": row.province,          
            "อำเภอ": row.district,          
            "ตำบล": row.sub_district,  
            "ชนิดเชื้อเพลิง": row.burn_type,        
            "ประเภทการใช้ที่ดิน": row.burn_type_des, 
            "ขนาดพื้นที่ที่ขอจัดการเชื้อเพลิง (ไร่)": Number(row.burn_area || 0), 
            "ละติจูด": Number(row.latitude || 0),  
            "ลองจิจูด": Number(row.longitude || 0), 
            
            // สถานะ
            "สถานะการอนุมัติ": row.status_text,   
            "ชื่อผู้อนุมัติ": row.approve_by_f_name, 
            "นามสกุลผู้อนุมัติ": row.approve_by_l_name, 
            "เบอร์โทรผู้อนุมัติ": row.approve_by, 
            "ขนาดพื้นที่อนุมัติ (ไร่)": Number(row.approve_burn || 0), 
            "วันที่จัดการเชื้อเพลิง": row.burn_date,          
        }));

        return NextResponse.json(formattedData);

    } catch (error: any) {
        console.error("Filter API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}