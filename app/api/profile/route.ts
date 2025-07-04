import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

async function getGmail() {
  const refreshToken = (await cookies()).get("refresh_token")?.value;
  if (!refreshToken) {
    throw new Error("Not authenticated");
  }
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: client });
}

export async function GET() {
  try {
    const gmail = await getGmail();
    const profile = await gmail.users.getProfile({ userId: "me" });
    return NextResponse.json({ email: profile.data.emailAddress });
  } catch (error: any) {
    if(error.message === 'Not authenticated'){
      return NextResponse.json({ message: error.message }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
