"use client";
import { useState } from "react";
import axios from "axios";

export default function CalendarPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [prompt, setPrompt] = useState("아래 일정들을 요약해줘:");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/calendar/summarize", {
        date,
        prompt,
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Calendar Summarizer</h1>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 w-full mb-4"
      />
      <textarea
        className="border p-2 w-full mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Summary prompt"
        rows={3}
      />
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
      >
        {loading ? "Summarizing..." : "Summarize Events"}
      </button>
      {summary && <p className="border p-4 rounded whitespace-pre-wrap">{summary}</p>}
    </main>
  );
}
