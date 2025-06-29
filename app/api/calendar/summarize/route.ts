import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

function getCalendar() {
  const refreshToken = cookies().get("refresh_token")?.value;
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
  const calendar = getCalendar();
  const start = new Date(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items || [];
}

export async function summarizeWithGemini(text: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}\n${text}`,
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
  const { date, prompt } = await request.json();
  if (!date) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
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
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
