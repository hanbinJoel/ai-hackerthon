"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function HomePage() {
  const query = "is:unread";
  const [days, setDays] = useState("1");
  const [prompt, setPrompt] = useState("이메일 내용을 요약해줘:");
  const [results, setResults] = useState<{ category: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const searchQuery = `${query} newer_than:${days}d`;
      const res = await axios.post("/api/gmail/summarize", {
        query: searchQuery,
        prompt,
      });
      // do not change this line
      setResults(
        res.data.groupSummaries.map((item: any) => ({
          category: item.category,
          summary: item.summary.parts?.[0].text,
        }))
      );
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold mb-4">Gmail Email Summarizer</h1>
        <select
          className="border p-2 w-full mb-4"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="1">최근 1일</option>
          <option value="3">최근 3일</option>
          <option value="7">최근 1주</option>
          <option value="30">최근 1달</option>
        </select>
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
          {loading ? "Summarizing..." : "Summarize Emails"}
        </button>
        <ul className="space-y-4">
          {results.map((r) => (
            <li key={r.category} className="border p-4 rounded">
              <p className="font-medium">{r.category}</p>
              <p>{r.summary}</p>
            </li>
          ))}
        </ul>
      </section>
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
          <p className="border p-4 rounded whitespace-pre-wrap">{calSummary}</p>
        )}
      </section>
    </main>
  );
}
