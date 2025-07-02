export async function summarizeWithGemini(
  text: string,
  prompt: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}\n${text}`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await res.json();
  return data.candidates?.[0]?.content ?? "";
}