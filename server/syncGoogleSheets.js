import { google } from 'googleapis';

export async function syncGoogleSheets(pool) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    range: 'Sheet1!A2:C',
  });

  const rows = response.data.values;

  for (const row of rows) {
    const [code, status, ready_packages] = row;

    await pool.query(
      `
      INSERT INTO orders (code, status, ready_packages)
      VALUES ($1, $2, $3)
      ON CONFLICT (code)
      DO UPDATE SET
        status = EXCLUDED.status,
        ready_packages = EXCLUDED.ready_packages,
        updated_at = CURRENT_TIMESTAMP
      `,
      [code, status, ready_packages]
    );
  }
}