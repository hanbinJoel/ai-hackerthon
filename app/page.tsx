"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import MdxView from "@/components/MdxView";

export default function HomePage() {
  const query = "is:unread";
  const [days, setDays] = useState("1");
  const [count, setCount] = useState("5");
  const [markRead, setMarkRead] = useState(true);
  const [prompt, setPrompt] = useState("이메일 내용을 요약해줘:");
  const [results, setResults] = useState<{ category: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(false);
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
          const saved = localStorage.getItem(`gmail_prompt_${res.data.email}`);
          if (saved) setPrompt(saved);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSavePrompt = () => {
    if (email) {
      localStorage.setItem(`gmail_prompt_${email}`, prompt);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const searchQuery = `${query} newer_than:${days}d`;
      const res = await axios.post("/api/gmail/summarize", {
        query: searchQuery,
        prompt,
        count: Number(count),
        markRead,
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
        <select
          className="border p-2 w-full mb-4"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        >
          <option value="5">이메일 5개</option>
          <option value="10">이메일 10개</option>
          <option value="15">이메일 15개</option>
        </select>
        <label className="flex items-center mb-4 space-x-2">
          <input
            type="checkbox"
            checked={markRead}
            onChange={(e) => setMarkRead(e.target.checked)}
          />
          <span>읽음 처리</span>
        </label>
        <textarea
          className="border p-2 w-full mb-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Summary prompt"
          rows={3}
        />
        <button
          onClick={handleSavePrompt}
          disabled={!email}
          className="bg-gray-600 text-white px-4 py-2 rounded mb-2"
        >
          Save Prompt
        </button>
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          {loading ? "Summarizing..." : "Summarize Emails"}
        </button>
        <ul className="space-y-4">
          {results.map((r) => (
            <li key={r.category} className="border p-4 rounded space-y-2">
              <p className="font-medium">{r.category}</p>
              <MdxView content={r.summary}/>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
