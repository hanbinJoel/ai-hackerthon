"use client";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      const finish = async () => {
        await fetch(`/api/auth/callback?${params.toString()}`);
        window.location.href = "/";
      };
      finish();
    } else {
      const go = async () => {
        const res = await fetch("/api/auth/url");
        const data = await res.json();
        window.location.href = data.url;
      };
      go();
    }
  }, []);

  return <p>Redirecting to Google login...</p>;
}
