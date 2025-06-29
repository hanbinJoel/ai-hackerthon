import { NextResponse } from "next/server";
import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const { tokens } = await oAuth2Client.getToken(code);
  const res = NextResponse.redirect(new URL("/", request.url));
  if (tokens.refresh_token) {
    res.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      path: "/",
    });
  }
  return res;
}
