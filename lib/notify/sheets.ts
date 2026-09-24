import { createSign } from "node:crypto";

/**
 * Дублирование заявки строкой в Google Sheets через сервисный аккаунт
 * (spreadsheets.values.append). Без GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL /
 * GOOGLE_PRIVATE_KEY модуль тихо отключён. Токен доступа получаем сами по JWT (RS256),
 * чтобы не тянуть тяжёлый пакет googleapis.
 *
 * Колонки: дата, тип заявки, имя, телефон, объект, комментарий, UTM-источник, UTM-кампания, страница.
 */

export interface SheetRow {
  date: string;
  typeLabel: string;
  name: string;
  phone: string;
  objectLabel: string;
  comment: string;
  utmSource: string;
  utmCampaign: string;
  pagePath: string;
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY,
  );
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(privateKey.replace(/\\n/g, "\n"), "base64url");
  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);

  const data: unknown = await response.json();
  const token =
    typeof data === "object" && data !== null && typeof (data as { access_token?: unknown }).access_token === "string"
      ? (data as { access_token: string }).access_token
      : null;
  if (!token) throw new Error("Google token response has no access_token");

  cachedToken = { value: token, expiresAt: now + 3600 };
  return token;
}

export async function appendLeadToSheet(row: SheetRow): Promise<{ skipped: boolean }> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!sheetId || !email || !privateKey) return { skipped: true };

  const token = await getAccessToken(email, privateKey);
  const range = encodeURIComponent("A:I");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      values: [
        [
          row.date,
          row.typeLabel,
          row.name,
          row.phone,
          row.objectLabel,
          row.comment,
          row.utmSource,
          row.utmCampaign,
          row.pagePath,
        ],
      ],
    }),
  });
  if (!response.ok) throw new Error(`Sheets append failed: ${response.status} ${await response.text()}`);
  return { skipped: false };
}
