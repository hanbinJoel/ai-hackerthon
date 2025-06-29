import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Base64 } from "js-base64";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
export const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function getBody(payload: any): string {
  if (payload.body && payload.body.data) {
    return Base64.decode(
      payload.body.data.replace(/-/g, "+").replace(/_/g, "/")
    );
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      // prefer text/plain
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Base64.decode(
          part.body.data.replace(/-/g, "+").replace(/_/g, "/")
        );
      }
    }
    // fallback first part
    return getBody(payload.parts[0]);
  }
  return "";
}

export async function fetchEmails(
  query: string = "is:unread"
): Promise<{ id: string; body: string }[]> {
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 5,
  });
  const messages = listRes.data.messages || [];
  const results: { id: string; body: string }[] = [];
  for (const msg of messages) {
    const m = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });
    const body = getBody(m.data.payload);
    results.push({ id: msg.id!, body });
  }
  return results;
}

export async function summarizeWithGemini(text: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `이메일 내용을 요약해줘:\n${text}`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await res.json();
  return data.candidates?.[0]?.content ?? "";
}

export async function POST(request: Request) {
  const { query } = await request.json();
  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }
  try {
    const emails = await fetchEmails(query);
    const summaries = await Promise.all(
      emails.map((e) => summarizeWithGemini(e.body))
    );
    const response = emails.map((e, i) => ({
      id: e.id,
      summary: summaries[i],
    }));
    return NextResponse.json({ summaries: response });
  } catch (error: any) {
    console.error("Error summarizing emails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
