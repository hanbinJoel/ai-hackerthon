"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calPrompt, setCalPrompt] = useState("아래 일정들을 요약해줘:");
  const [calSummary, setCalSummary] = useState("");
  const [calLoading, setCalLoading] = useState(false);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      const finish = async () => {
        await fetch(`/api/auth/callback?${params.toString()}`);
        window.location.href = "/";
      };
      finish();
    }
  }, []);

  const handleCalendarSummarize = async () => {
    setCalLoading(true);
    try {
      const res = await axios.post("/api/calendar/summarize", {
        date,
        prompt: calPrompt,
      });
      setCalSummary(res.data.summary.parts?.[0].text);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }
      console.error(err);
    } finally {
      setCalLoading(false);
    }
  };



  return (
    <main className="p-6 max-w-xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Summarizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-md p-2 w-full"
          />
          <textarea
            className="border rounded-md p-2 w-full"
            value={calPrompt}
            onChange={(e) => setCalPrompt(e.target.value)}
            placeholder="Summary prompt"
            rows={3}
          />
          <Button onClick={handleCalendarSummarize} disabled={calLoading}>
            {calLoading ? "Summarizing..." : "Summarize Events"}
          </Button>
          {calSummary && (
            <p className="border p-4 rounded whitespace-pre-wrap">{calSummary}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
