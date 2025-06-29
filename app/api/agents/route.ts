import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

let agents: { id: string; name: string; promptTemplate: string }[] = [];

export async function GET() {
  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const { id, name, promptTemplate } = await request.json();
  if (id) {
    agents = agents.map((a) =>
      a.id === id ? { id, name, promptTemplate } : a
    );
    const updated = agents.find((a) => a.id === id)!;
    return NextResponse.json(updated);
  }
  const newAgent = { id: uuidv4(), name, promptTemplate };
  agents.push(newAgent);
  return NextResponse.json(newAgent);
}
