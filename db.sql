CREATE TABLE public.report_data (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    user_full_name VARCHAR(255),
    title VARCHAR(50),
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    moo VARCHAR(50),
    village VARCHAR(255),
    sub_district VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    position VARCHAR(255),
    burn_date DATE,
    burn_type VARCHAR(100),
    burn_type_des TEXT,
    burn_area DECIMAL(10, 2), -- หน่วยพื้นที่ เช่น ไร่
    approve_burn DECIMAL(10, 2),
    actual_burn DECIMAL(10, 2),
    process_approve BOOLEAN DEFAULT null,
    is_burn BOOLEAN DEFAULT null,
    is_approve BOOLEAN DEFAULT null,
    is_process BOOLEAN DEFAULT null,
    is_reject BOOLEAN DEFAULT null,
    burn_decition BOOLEAN DEFAULT null,
    request_no VARCHAR(100),
    approve_by INTEGER, -- ID ของผู้อนุมัติ
    approve_by_f_name VARCHAR(100),
    approve_by_l_name VARCHAR(100)
);

drop table public.report_data
select * from public.report_data

CREATE EXTENSION postgis;

select * from public.th_province_4326
select * from public.th_amphoe_4326
select * from public.th_tambon_4326


-- ล้างข้อมูลเก่าก่อน (ถ้ามี)
TRUNCATE TABLE public.report_data;

-- 1. สถานการณ์: อนุมัติทั้งหมด (is_approve = true, is_reject = false)
-- ผลที่คาดหวัง: จะไปโผล่ใน Filter 'approved_all', display_area ต้องดึงมาจาก approve_burn (50.00)
INSERT INTO public.report_data (
    user_full_name, province, district, sub_district, burn_area, approve_burn, actual_burn, 
    is_approve, is_reject, request_no, burn_type
) VALUES (
    'นายอนุมัติ ทดสอบ', 'เชียงใหม่', 'เมืองเชียงใหม่', 'ศรีภูมิ', 100.00, 50.00, 0, 
    true, false, 'REQ-001', 'พื้นที่เกษตร'
);

-- 2. สถานการณ์: อนุมัติรายงานผลแล้ว (is_approve = true, is_reject = false, actual_burn > 0)
-- ผลที่คาดหวัง: จะไปโผล่ใน Filter 'reported', display_area ต้องดึงมาจาก actual_burn (45.00)
INSERT INTO public.report_data (
    user_full_name, province, district, sub_district, burn_area, approve_burn, actual_burn, 
    is_approve, is_reject, request_no, burn_type
) VALUES (
    'นางรายงานแล้ว ทดสอบ', 'เชียงใหม่', 'แม่ริม', 'ริมใต้', 60.00, 60.00, 45.00, 
    true, false, 'REQ-002', 'ไร่อ้อย'
);

-- 3. สถานการณ์: อนุมัติแล้วยังไม่รายงาน (is_approve = true, is_reject = false, actual_burn = 0)
-- ผลที่คาดหวัง: จะไปโผล่ใน Filter 'waiting_report', display_area ต้องดึงมาจาก approve_burn (30.00)
INSERT INTO public.report_data (
    user_full_name, province, district, sub_district, burn_area, approve_burn, actual_burn, 
    is_approve, is_reject, request_no, burn_type
) VALUES (
    'นายรอรายงาน ทดสอบ', 'เชียงใหม่', 'หางดง', 'หางดง', 30.00, 30.00, 0, 
    true, false, 'REQ-003', 'ป่าไม้'
);

-- 4. สถานการณ์: รออนุมัติ (is_approve = false, is_reject = false)
-- ผลที่คาดหวัง: จะไปโผล่ใน Filter 'pending', display_area ต้องดึงมาจาก burn_area (20.00)
INSERT INTO public.report_data (
    user_full_name, province, district, sub_district, burn_area, approve_burn, actual_burn, 
    is_approve, is_reject, request_no, burn_type
) VALUES (
    'นางสาวรออนุมัติ ทดสอบ', 'เชียงใหม่', 'สันทราย', 'สันทรายน้อย', 20.00, 0, 0, 
    false, false, 'REQ-004', 'วัชพืชริมทาง'
);

-- 5. สถานการณ์: ไม่อนุมัติ (is_approve = false, is_reject = true)
-- ผลที่คาดหวัง: จะไปโผล่ใน Filter 'rejected', display_area ต้องดึงมาจาก burn_area (15.00)
INSERT INTO public.report_data (
    user_full_name, province, district, sub_district, burn_area, approve_burn, actual_burn, 
    is_approve, is_reject, request_no, burn_type
) VALUES (
    'นายถูกปฏิเสธ ทดสอบ', 'เชียงใหม่', 'ดอยสะเก็ด', 'เชิงดอย', 15.00, 0, 0, 
    false, true, 'REQ-005', 'ขยะมูลฝอย'
);