"use client";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MdxView from "@/components/MdxView";

export default function JiraPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/jira/create", { url });
      setMessage(`Created issue ${res.data.key}`);
      setSummary(res.data.summary?.parts?.[0].text);
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
      <Button onClick={handleCreate} disabled={loading || !url}>
        {loading ? "Creating..." : "Create JIRA Ticket"}
      </Button>
      {message && <p className="mt-4 break-all">{message}</p>}
      {summary && <MdxView content={summary} />}
    </main>
  );
}
