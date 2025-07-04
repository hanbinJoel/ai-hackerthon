"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const query = "is:unread";
  const [days, setDays] = useState("1");
  const [count, setCount] = useState("5");
  const [markRead, setMarkRead] = useState(true);
  const [prompt, setPrompt] = useState("이메일 내용을 요약해줘:");
  const [results, setResults] = useState<{ category: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(false);


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
      <Card>
        <CardHeader>
          <CardTitle>Gmail Email Summarizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="border rounded-md p-2 w-full"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="1">최근 1일</option>
          <option value="3">최근 3일</option>
          <option value="7">최근 1주</option>
          <option value="30">최근 1달</option>
        </select>
          <select
            className="border rounded-md p-2 w-full"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        >
          <option value="5">이메일 5개</option>
          <option value="10">이메일 10개</option>
          <option value="15">이메일 15개</option>
        </select>
          <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={markRead}
            onChange={(e) => setMarkRead(e.target.checked)}
          />
          <span>읽음 처리</span>
        </label>
          <textarea
            className="border rounded-md p-2 w-full"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Summary prompt"
          rows={3}
        />
          <Button onClick={handleSummarize} disabled={loading}>
            {loading ? "Summarizing..." : "Summarize Emails"}
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-4">
          {results.map((r) => (
            <Card key={r.category}>
              <CardHeader>
                <CardTitle className="text-lg">{r.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{r.summary}</p>
              </CardContent>
            </Card>
          ))}
      </ul>
    </main>
  );
}
