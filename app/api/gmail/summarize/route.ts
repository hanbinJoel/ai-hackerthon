import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { Base64 } from "js-base64";
import { summarizeWithGemini } from "@/lib/gemini";

type Email = {
  id: string;
  body: string;
  subject: string;
  from: string;
  category: string;
};

function getHeader(headers: any[], name: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

function extractDomain(address: string): string {
  const m = address.match(/<([^>]+)>/);
  const email = (m ? m[1] : address).split("@")[1];
  return email ? email.toLowerCase() : "";
}

function categorizeEmail(
  subject: string,
  from: string,
  body: string,
  userDomain: string
): string {
  const text = `${subject} ${from} ${body}`.toLowerCase();
  if (text.includes("github")) return "github";
  if (text.includes("jira") || text.includes("atlassian.net")) return "jira";
  const fromDomain = extractDomain(from);
  if (
    fromDomain === userDomain ||
    text.includes("oasis") ||
    text.includes("공지")
  ) {
    return "internal";
  }
  return "external";
}

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
  query: string = "is:unread",
  count: number,
  markRead: boolean
): Promise<Email[]> {
  const gmail = await getGmail();
  const profile = await gmail.users.getProfile({ userId: "me" });
  const userDomain = profile.data.emailAddress?.split("@")[1]?.toLowerCase() || "";

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: count,
  });
  const messages = listRes.data.messages || [];
  const results: Email[] = [];
  for (const msg of messages) {
    const m = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });
    const payload = m.data.payload!;
    const body = getBody(payload);
    const subject = getHeader(payload.headers || [], "Subject");
    const from = getHeader(payload.headers || [], "From");
    const category = categorizeEmail(subject, from, body, userDomain);
    results.push({ id: msg.id!, body, subject, from, category });
    if (markRead) {
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id!,
        requestBody: { removeLabelIds: ["UNREAD"] },
      });
    }
  }
  return results;
}

export async function POST(request: Request) {
  const { query = "", prompt, count = 15, markRead = true } = await request.json();
  try {
    const allowedCounts = [15, 30, 50];
    const emailCount =
      allowedCounts.includes(Number(count)) ? Number(count) : 15;
    const mark = Boolean(markRead);
    const summaryPrompt = prompt || "이메일 내용을 요약해줘:";
    const emails = await fetchEmails(query, emailCount, mark);

    const grouped: Record<string, Email[]> = {};
    for (const email of emails) {
      if (!grouped[email.category]) grouped[email.category] = [];
      grouped[email.category].push(email);
    }

    const groupSummaries: { category: string; summary: string }[] = [];
    for (const [category, list] of Object.entries(grouped)) {
      const text = list.map((e) => e.body).join("\n");
      const summary = await summarizeWithGemini(text, summaryPrompt);
      groupSummaries.push({ category, summary });
    }

    return NextResponse.json({ groupSummaries });
  } catch (error: any) {
    if (error.status === 401 || error.message === 'Not authenticated') {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
