"use client";
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MdxView from "@/components/MdxView";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PROMPT =
 `다음은 PRD 문서입니다. 이 문서를 다음 기준에 따라 명확하고 간결하게 요약해 주세요:

1. 🧩 **문제 정의 및 배경**: 왜 이 기능이 필요한가요?
2. 🎯 **핵심 목표 (Goals)**: 이 기능/프로젝트의 최종 목적은 무엇인가요?
3. 🛠 **주요 기능 요약**: 구현하려는 기능을 한 문단 이내로 요약해 주세요.
4. 👥 **타깃 사용자 / 유저 스토리**: 주요 사용자와 그들의 목적은 무엇인가요?
5. ⚠️ **제약 조건 / 기술 고려사항**: 특별한 제한, 기술 스택, 외부 API, 보안 등
6. 🗂 **우선순위 / 일정**: 우선순위가 높은 기능, 예상 릴리스 일정 등
7. 📝 **추가 참고사항**: 용어 정의, 유사 시스템, 경쟁 서비스 참고 여부 등

문장은 짧고 명확하게, 항목별로 나눠서 작성해 주세요.`

export default function JiraPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  const handleCreate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/api/jira/create", { url, prompt });
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
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="mb-4"
      />
      <Button onClick={handleCreate} disabled={loading || !url}>
        {loading ? "Creating..." : "Create JIRA Ticket"}
      </Button>
      <div className={'text-red-400'}>현재 요약까지만 가능하고 티켓 생성은 권한을 승인 받지 못해 불가합니다.</div>
      {message && <p className="mt-4 break-all">{message}</p>}
      {summary && <MdxView content={summary} />}
    </main>
  );
}
