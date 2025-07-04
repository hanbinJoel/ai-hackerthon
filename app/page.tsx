"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import MdxView from "@/components/MdxView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DEFAULT_PROMPT = `관심사 기반으로 묶기:
내용이 유사한 주제(예: 회의 일정, 요청사항, 고객 피드백 등)끼리 그룹별로 묶어 요약해 주세요.
각 그룹에는 짧은 제목(소제목)을 붙여 주세요.

핵심만 요약하기:
중요한 정보, 요청, 결정사항만 포함해 주세요.
불필요한 수식어, 인사말, 배경 설명 등은 생략하세요.

액션 아이템 강조:
사용자가 해야 할 일(To-do), 응답 필요 여부, 기한 등이 있다면 눈에 띄게 정리해 주세요.
(예: 🔔 응답 필요, 📅 마감일 등 이모지 사용 가능)

문장 길이는 간결하게 유지:
각 요약 항목은 1줄로 간단하게 요약해주세요.

원본 링크 추가:
각 요약 항목에 대한 이메일 링크도 함께 전달해주세요.
`

export default function HomePage() {
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [days, setDays] = useState("1");
  const [count, setCount] = useState("15");
  const [markRead, setMarkRead] = useState(true);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [results, setResults] = useState<
    { category: string; label: string; summary: string }[]
  >([]);
  const CATEGORY_LABELS: Record<string, string> = {
    internal: "사내 메일",
    external: "사외 메일",
  };
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
      const searchQuery = `${unreadOnly ? "is:unread " : ""}newer_than:${days}d`;
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
          label: CATEGORY_LABELS[item.category] || item.category,
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
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="최근 일수 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">최근 1일</SelectItem>
            <SelectItem value="3">최근 3일</SelectItem>
            <SelectItem value="7">최근 1주</SelectItem>
            <SelectItem value="30">최근 1달</SelectItem>
          </SelectContent>
        </Select>
        <Select value={count} onValueChange={setCount}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="이메일 개수 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">이메일 15개</SelectItem>
            <SelectItem value="30">이메일 30개</SelectItem>
            <SelectItem value="50">이메일 50개</SelectItem>
          </SelectContent>
        </Select>
        <Label className="flex items-center mb-4 space-x-2">
          <Input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4"
          />
          <span>읽지 않은 메일만</span>
        </Label>
        <Label className="flex items-center mb-4 space-x-2">
          <Input
            type="checkbox"
            checked={markRead}
            onChange={(e) => setMarkRead(e.target.checked)}
            className="w-4 h-4"
          />
          <span>요약된 이메일 읽음 처리</span>
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Summary prompt"
          rows={3}
          className="mb-4"
        />
        <Button
          onClick={handleSavePrompt}
          disabled={!email}
          variant="secondary"
          className="mb-2 mr-2"
        >
          Save Prompt
        </Button>
        <Button
          onClick={handleSummarize}
          disabled={loading}
          className="mb-6"
        >
          {loading ? "Summarizing..." : "Summarize Emails"}
        </Button>
        <ul className="space-y-4">
          {results.map((r) => (
            <li key={r.category} className="border p-4 rounded space-y-2">
              <Badge variant={r.category as any}>{r.label}</Badge>
              <MdxView content={r.summary} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
