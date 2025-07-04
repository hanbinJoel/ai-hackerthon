import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { summarizeWithGemini } from "@/lib/gemini";

function extractDocId(url: string): string | null {
  const m = url.match(/\/d\/(.+?)(?:\/|$)/);
  return m ? m[1] : null;
}

async function getDocs() {
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
  return google.docs({ version: "v1", auth: client });
}

function extractText(elements: any[]): string {
  let text = "";
  for (const el of elements) {
    if (el.paragraph) {
      for (const pe of el.paragraph.elements || []) {
        text += pe.textRun?.content || "";
      }
      text += "\n";
    }
  }
  return text;
}

async function fetchDocumentText(docId: string): Promise<string> {
  const docs = await getDocs();
  const res = await docs.documents.get({ documentId: docId });
  return extractText(res.data.body?.content || []);
}

function parseJson(text: string): { title: string; description: string } | null {
  try {
    // remove code block markers if present
    const cleaned = text.replace(/^```(?:json)?|```$/g, "");
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function createJiraIssue(title: string, description: string) {
  if (
    !process.env.JIRA_BASE_URL ||
    !process.env.JIRA_EMAIL ||
    !process.env.JIRA_TOKEN ||
    !process.env.JIRA_PROJECT_KEY
  ) {
    throw new Error("Jira environment variables not configured");
  }
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`
  ).toString("base64");
  const res = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: process.env.JIRA_PROJECT_KEY },
        summary: title,
        description,
        issuetype: { name: "Task" },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  const data = await res.json();
  return data.key as string;
}

export async function POST(request: Request) {
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  try {
    const docId = extractDocId(url);
    if (!docId) {
      return NextResponse.json({ error: "Invalid Google Docs url" }, { status: 400 });
    }
    const text = await fetchDocumentText(docId);
    const prompt =
      "다음 문서를 읽고 JIRA 티켓 생성을 위한 title과 description을 한국어 JSON으로 제공해줘. 형식: {\"title\":\"...\",\"description\":\"...\"}";
    const summary = await summarizeWithGemini(text, prompt);
    const parsed = parseJson(summary as any) || { title: "Auto Generated", description: summary as any };
    const key = await createJiraIssue(parsed.title, parsed.description);
    return NextResponse.json({ key });
  } catch (error: any) {
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
