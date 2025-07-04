"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

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
      <ShadSidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>계정</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="text-xs text-muted-foreground break-all ml-2">
                {email ? email : "Not logged in"}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>기능</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={typeof window !== 'undefined' && window.location.pathname === "/"}>
                    <Link href="/">Gmail 요약</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={typeof window !== 'undefined' && window.location.pathname.startsWith("/calendar")}> 
                    <Link href="/calendar">일정 요약</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={typeof window !== 'undefined' && window.location.pathname.startsWith("/TBU")}>
                    <Link href="/TBU">TBU (더 많은 AI 기능들..!)</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ShadSidebar>
  );
}
