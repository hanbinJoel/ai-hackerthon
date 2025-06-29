"use client";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const go = async () => {
      const res = await fetch("/api/auth/url");
      const data = await res.json();
      window.location.href = data.url;
    };
    go();
  }, []);

  return <p>Redirecting to Google login...</p>;
}
