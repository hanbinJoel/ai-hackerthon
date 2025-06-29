"use client";
import { useState } from "react";
import axios from "axios";

export default function HomePage() {
  const query = "is:unread";
  const [days, setDays] = useState("1");
  const [prompt, setPrompt] = useState("이메일 내용을 요약해줘:");
  const [results, setResults] = useState<{ id: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
        res.data.summaries.map((item) => ({
          id: item.id,
          summary: item.summary.parts?.[0].text,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
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
          <li key={r.id} className="border p-4 rounded">
            <p className="font-medium">Email ID: {r.id}</p>
            <p>{r.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
