"use client";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPT =
  "다음 문서를 읽고 JIRA 티켓 생성을 위한 title과 description을 한국어 JSON으로 제공해줘. 형식: {\"title\":\"...\",\"description\":\"...\"}";

export default function JiraPage() {
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/jira/create", { url, prompt });
      setMessage(`Created issue ${res.data.key}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Google Docs to JIRA</h1>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Google Docs link"
        className="mb-4"
      />
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="mb-4"
      />
      <Button onClick={handleCreate} disabled={loading || !url}>
        {loading ? "Creating..." : "Create JIRA Ticket"}
      </Button>
      {message && <p className="mt-4 break-all">{message}</p>}
    </main>
  );
}
