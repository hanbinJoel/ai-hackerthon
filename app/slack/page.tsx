"use client";
import { useState } from "react";
import axios from "axios";
import MdxView from "@/components/MdxView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPT = `아래 슬랙 메시지들을 요약해줘:
- 중요하거나 긴급한 내용 위주로 정리해줘.
- 비슷한 주제는 묶어서 보여줘.`;

export default function SlackPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/slack/summarize", { prompt });
      setSummary(res.data.summary.parts?.[0].text ?? "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Slack Message Summarizer</h1>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mb-4"
        />
        <Button onClick={handleSummarize} disabled={loading} className="mb-6">
          {loading ? "Summarizing..." : "Summarize Messages"}
        </Button>
        {summary && (
          <div className="border p-4 rounded">
            <MdxView content={summary} />
          </div>
        )}
      </section>
    </main>
  );
}
