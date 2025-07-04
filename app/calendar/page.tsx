"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import MdxView from "@/components/MdxView";

export default function CalendarPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calPrompt, setCalPrompt] = useState("아래 일정들을 요약해줘:");
  const [calSummary, setCalSummary] = useState("");
  const [calLoading, setCalLoading] = useState(false);
  const [email, setEmail] = useState("");


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

  useEffect(() => {
    axios
      .get("/api/profile")
      .then((res) => {
        if (res.data.email) {
          setEmail(res.data.email);
          const saved = localStorage.getItem(
            `calendar_prompt_${res.data.email}`
          );
          if (saved) setCalPrompt(saved);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (email) {
      localStorage.setItem(`calendar_prompt_${email}`, calPrompt);
    }
  }, [email, calPrompt]);

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
      <section>
        <h1 className="text-2xl font-bold mb-4">Calendar Summarizer</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <textarea
          className="border p-2 w-full mb-4"
          value={calPrompt}
          onChange={(e) => setCalPrompt(e.target.value)}
          placeholder="Summary prompt"
          rows={3}
        />
        <button
          onClick={handleCalendarSummarize}
          disabled={calLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          {calLoading ? "Summarizing..." : "Summarize Events"}
        </button>
        {calSummary && (
          <div className="border p-4 rounded">
            <MdxView content={calSummary} />
          </div>
        )}
      </section>
    </main>
  );
}
