import { Pool } from 'pg'

// Database สำหรับข้อมูล Report (report_fired)
export const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Database สำหรับ Boundary data (drawData_fireD)
export const boundaryDb = new Pool({
  user: process.env.BOUNDARY_DB_USER,
  host: process.env.BOUNDARY_DB_HOST,
  database: process.env.BOUNDARY_DB_NAME,
  password: process.env.BOUNDARY_DB_PASSWORD,
  port: parseInt(process.env.BOUNDARY_DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})
