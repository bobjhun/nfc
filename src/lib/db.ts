import mysql, { type Pool } from "mysql2/promise";

declare global {
  var mysqlPool: Pool | undefined;
}

const poolOptions = {
  host: process.env.DB_HOST ?? "srv2100.hstgr.io",
  database: process.env.DB_NAME ?? "u451395970_nfc",
  user: process.env.DB_USER ?? "u451395970_nfc",
  password: process.env.DB_PASSWORD ?? "Nfc2026!",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z" as const,
  decimalNumbers: true,
};

export const db =
  global.mysqlPool ??
  mysql.createPool(poolOptions);

if (process.env.NODE_ENV !== "production") {
  global.mysqlPool = db;
}
