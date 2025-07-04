import { NextResponse } from "next/server";

// This route returns a mock summary instead of calling Slack APIs.

export async function POST(request: Request) {
  const mockSummary =
    "오늘 회의에서는 신규 기능 개발 일정과 배포 계획이 논의되었습니다.\n" +
    "- 다음 주 중으로 QA 완료 예정\n" +
    "- 배포는 금요일 3pm 예정\n" +
    "- 잠재적인 리스크 및 버그에 대한 사전 점검 필요";
  return NextResponse.json({ summary: mockSummary });
}
