"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <Card className="w-64 min-h-screen rounded-none border-r">
      <CardHeader>
        <p className="font-bold mb-1">Profile</p>
        {email ? (
          <p className="text-sm break-all">{email}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Not logged in</p>
        )}
      </CardHeader>
      <nav className="space-y-2 px-6 pb-6">
        <Link href="/">
          <Button variant="outline" className="w-full justify-start">
            Gmail Summary
          </Button>
        </Link>
        <Link href="/calendar">
          <Button variant="outline" className="w-full justify-start">
            Calendar Summary
          </Button>
        </Link>
      </nav>
    </Card>
  );
}
