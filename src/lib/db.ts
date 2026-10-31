import mysql, { type Pool } from "mysql2/promise";

declare global {
  var mysqlPool: Pool | undefined;
}

const poolOptions = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? "3307"),
  database: process.env.DB_NAME ?? "social_media",
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
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
