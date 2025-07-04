"use client";
import React from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseInline(text: string): string {
  const escaped = escapeHtml(text);

  const segments: string[] = [];
  let lastIndex = 0;
  const codeRegex = /`([^`]+)`/g;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(escaped))) {
    segments.push(
      escaped
        .slice(lastIndex, match.index)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (
          _m,
          text,
          url,
        ) =>
          `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${text}</a>`,
        )
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
    );
    segments.push(`<code>${match[1]}</code>`);
    lastIndex = codeRegex.lastIndex;
  }

  segments.push(
    escaped
      .slice(lastIndex)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (
        _m,
        text,
        url,
      ) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${text}</a>`,
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
  );

  return segments.join("");
}

export function mdxToHtml(mdx: string): string {
  const lines = mdx.split(/\r?\n/);
  let html = "";
  let list: "ul" | "ol" | null = null;
  let inCode = false;
  let codeBuffer: string[] = [];

  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };

  const flushCode = () => {
    if (inCode) {
      html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
      inCode = false;
      codeBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html += `<h${level}>${parseInline(heading[2])}</h${level}>`;
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)/);
    if (ol) {
      if (list !== "ol") {
        closeList();
        list = "ol";
        html += `<ol>`;
      }
      html += `<li>${parseInline(ol[1])}</li>`;
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.*)/);
    if (ul) {
      if (list !== "ul") {
        closeList();
        list = "ul";
        html += `<ul>`;
      }
      html += `<li>${parseInline(ul[1])}</li>`;
      continue;
    }

    if (line.trim() === "") {
      closeList();
      html += "<br/>";
      continue;
    }

    closeList();
    html += `<p>${parseInline(line)}</p>`;
  }

  flushCode();
  closeList();
  return html;
}

export default function MdxView({ content }: { content: string }) {
  return <div className={'overflow-auto'} dangerouslySetInnerHTML={{ __html: mdxToHtml(content) }} />;
}

