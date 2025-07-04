import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { summarizeWithGemini } from "@/lib/gemini";

async function getCalendar() {
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
  return google.calendar({ version: "v3", auth: client });
}

async function fetchEvents(date: string) {
  const calendar = await getCalendar();
  const tz = "Asia/Seoul";
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    timeZone: tz,
  });
  return res.data.items || [];
}

export async function POST(request: Request) {
  const { date, prompt } = await request.json();
  if (!date) {
    return NextResponse.json(
      { error: "Missing date parameter" },
      { status: 400 }
    );
  }
  try {
    const events = await fetchEvents(date);
    const text = events
      .map((e) => `${e.start?.dateTime || e.start?.date} - ${e.summary}`)
      .join("\n");
    const summaryPrompt = prompt || "아래 일정들을 요약해줘:";
    const summary = await summarizeWithGemini(text, summaryPrompt);
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error summarizing calendar:", error);
    if (error.status === 401 || error.message === 'Not authenticated') {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
