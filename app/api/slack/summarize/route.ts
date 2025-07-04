import { NextResponse } from "next/server";
import { summarizeWithGemini } from "@/lib/gemini";

async function fetchUnreadMessages(count: number): Promise<string[]> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Slack token not configured");
  }
  const res = await fetch(
    `https://slack.com/api/search.messages?query=is:unread&count=${count}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();
  if (!data.ok) {
    if (data.error === "missing_scope") {
      const needed = data.needed ? `: ${data.needed}` : "";
      throw new Error(
        `Slack token is missing required scope${needed}. Check your app permissions.`
      );
    }
    throw new Error(data.error || "Failed to fetch Slack messages");
  }
  const matches = data.messages?.matches || [];
  return matches.map((m: any) => m.text as string);
}

export async function POST(request: Request) {
  const { count = 20, prompt } = await request.json();
  try {
    const messages = await fetchUnreadMessages(Number(count));
    const text = messages.join("\n");
    const summaryPrompt = prompt || "아래 슬랙 메시지들을 요약해줘:";
    const summary = await summarizeWithGemini(text, summaryPrompt);
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Slack summarization error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
