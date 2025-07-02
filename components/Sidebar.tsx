"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    axios
      .get("/api/profile")
      .then((res) => setEmail(res.data.email))
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="w-64 bg-gray-100 p-4 space-y-4 min-h-screen">
      <div>
        <p className="font-bold mb-1">Profile</p>
        {email ? (
          <p className="text-sm break-all">{email}</p>
        ) : (
          <p className="text-sm text-gray-500">Not logged in</p>
        )}
      </div>
      <nav className="space-y-2">
        <Link href="/" className="block p-2 rounded hover:bg-gray-200">
          Gmail Summary
        </Link>
        <Link href="/calendar" className="block p-2 rounded hover:bg-gray-200">
          Calendar Summary
        </Link>
      </nav>
    </div>
  );
}
