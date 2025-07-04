"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import MdxView from "@/components/MdxView";

const DEFAULT_PROMPT =`아래의 구글 캘린더 일정을 읽고, 다음 조건을 만족하는 요약을 작성해줘:
1. 비슷한 성격의 일정(예: 회의, 업무, 운동 등)은 묶어서 요약해줘.  
2. 반복적인 일정은 하나로 요약하고, 반복 빈도(매일, 매주 등)도 함께 알려줘.  
3. 핵심 정보(무엇, 언제, 누구와)를 중심으로 간결하게 정리해줘.  
4. 불필요한 세부 내용이나 위치 정보 등은 생략해도 좋아.  
5. 관심사별 카테고리(예: 업무 / 회의 / 개인 / 헬스 등)로 나눠서 보여줘.  
6. 일정의 시간 흐름이나 집중 시간대를 파악할 수 있게 정리해줘.

## 📝 출력 형식 예시
📅 주간 일정 요약 (7월 1일 ~ 7월 7일)

🔹 업무 관련  
- 프로젝트 미팅 (화/목 10:00, 팀원들과)  
- 디자인 리뷰 (수 15:00, 디자이너와)  

🔹 시간대별 집중도  
- 오전: 회의 다수 집중  
- 오후: 개인 업무 및 일정 다수  
`

export default function CalendarPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calPrompt, setCalPrompt] = useState(DEFAULT_PROMPT);
  const [calSummary, setCalSummary] = useState("");
  const [calLoading, setCalLoading] = useState(false);
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
          const saved = localStorage.getItem(
            `calendar_prompt_${res.data.email}`
          );
          if (saved) setCalPrompt(saved);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSavePrompt = () => {
    if (email) {
      localStorage.setItem(`calendar_prompt_${email}`, calPrompt);
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
          onClick={handleSavePrompt}
          disabled={!email}
          className="bg-gray-600 text-white px-4 py-2 rounded mb-2"
        >
          Save Prompt
        </button>
        <button
          onClick={handleCalendarSummarize}
          disabled={calLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          {calLoading ? "Summarizing..." : "Summarize Events"}
        </button>
        {calSummary && (
          <div className="border p-4 rounded">
            <MdxView content={calSummary}/>
          </div>
        )}
      </section>
    </main>
  );
}
