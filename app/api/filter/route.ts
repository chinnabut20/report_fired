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
                    WHEN burn_decition = true THEN 'ควรอนุมัติ'
                    WHEN burn_decition = false THEN 'ไม่ควรอนุมัติ'
                    ELSE '-' 
                END AS decision_text,
                
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
            
            title: row.title,              // คำนำหน้า
            firstname: row.firstname,      // ชื่อจริง
            lastname: row.lastname,        // นามสกุล
            phone: row.phone,              // เบอร์โทรศัพท์
            created_at: row.created_at,    // วันที่ส่งคำร้อง

            province: row.province,           // จังหวัด
            district: row.district,           // อำเภอ
            sub_district: row.sub_district,   // ตำบล
            burn_type: row.burn_type,         // ชนิดเชื้อเพลิง
            burn_type_des: row.burn_type_des, // ประเภทการใช้ที่ดิน
            burn_area: Number(row.burn_area || 0), // ขนาดพื้นที่ที่ขอจัดการเชื้อเพลิง (ไร่)
            latitude: Number(row.latitude || 0),   // ละติจูด
            longitude: Number(row.longitude || 0), // ลองจิจูด
            
            status_text: row.status_text,     // สถานะการอนุมัติ 
            decision_text: row.decision_text, // คำแนะนำ/ผลการพิจารณา 
            
            approve_by_firstname: row.approve_by_f_name, // ชื่อผู้อนุมัติ
            approve_by_lastname: row.approve_by_l_name,  // นามสกุลผู้อนุมัติ
            approve_by_phone: row.approve_by,            // เบอร์โทรผู้อนุมัติ
            approve_burn_area: Number(row.approve_burn || 0), // ขนาดพื้นที่อนุมัติ (ไร่)
            burn_date: row.burn_date          // วันที่จัดการเชื้อเพลิง

        }));

        return NextResponse.json(formattedData);

    } catch (error: any) {
        console.error("Filter API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}