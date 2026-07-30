import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import { Pool } from "pg"
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

function getDb() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) {
    throw new Error(
      "NEON_DATABASE_URL environment variable is not set. " +
        "Create a .env.local file with your Neon connection string.",
    )
  }

  if (url.includes("neon.tech")) {
    const sql = neon(url)
    return drizzleNeon(sql, { schema })
  }

  const pool = new Pool({ connectionString: url })
  return drizzlePg(pool, { schema })
}

let _db: ReturnType<typeof getDb> | null = null

export function db() {
  if (!_db) {
    _db = getDb()
  }
  return _db
}
