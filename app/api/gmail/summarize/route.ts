import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { Base64 } from "js-base64";
import { summarizeWithGemini } from "@/lib/gemini";

async function getGmail() {
  const refreshToken = (await cookies()).get("refresh_token")?.value;

  if (!refreshToken) {
    throw new Error("Not authenticated");
  }
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: client });
}

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

async function fetchEmails(
  query: string = "is:unread"
): Promise<{ id: string; body: string }[]> {
  const gmail = await getGmail();
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
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
    await gmail.users.messages.modify({
      userId: "me",
      id: msg.id!,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
  }
  return results;
}

export async function POST(request: Request) {
  const { query, prompt } = await request.json();
  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }
  try {
    const summaryPrompt = prompt || "이메일 내용을 요약해줘:";
    const emails = await fetchEmails(query);
    const summaries = await Promise.all(
      emails.map((e) => summarizeWithGemini(e.body, summaryPrompt))
    );
    const response = emails.map((e, i) => ({
      id: e.id,
      summary: summaries[i],
    }));
    return NextResponse.json({ summaries: response });
  } catch (error: any) {
    console.error("Error summarizing emails:", error);
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
