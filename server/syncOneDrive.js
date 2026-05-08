// 

import * as XLSX from "xlsx";

export async function syncExcel(pool) {

  const workbook = XLSX.readFile("./data/orders.xlsx");

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet);

  for (const row of rows) {

    await pool.query(
      `
      INSERT INTO orders (code, status, ready_packages)
      VALUES ($1, $2, $3)
      ON CONFLICT (code)
      DO UPDATE SET
        status = EXCLUDED.status,
        ready_packages = EXCLUDED.ready_packages
      `,
      [row.code, row.status, row.ready_packages]
    );
  }
}