import { Pool } from 'pg'

export const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})


export const db_local = new Pool({
  user: process.env.DB_USER_LOCAL,
  host: process.env.DB_HOST_LOCAL,
  database: process.env.DB_NAME_LOCAL,
  password: process.env.DB_PASS_LOCAL,
  port: process.env.DB_PORT_LOCAL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})
