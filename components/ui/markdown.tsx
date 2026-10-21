"use client";

import React from "react";

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text: string): string {
  let value = escape(text);
  value = value.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-brand-500 dark:text-brand-300 hover:opacity-80 transition-opacity">$1</a>',
  );
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-inherit">$1</strong>');
  value = value.replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em class="italic opacity-90">$2</em>');
  value = value.replace(
    /`([^`]+)`/g,
    '<code class="rounded-md bg-brand-100/70 dark:bg-white/10 px-1.5 py-0.5 text-[0.82em] font-mono text-brand-700 dark:text-brand-300">$1</code>',
  );
  return value;
}

const HEADING_CLASSES = [
  "mt-5 mb-2 font-display text-base font-bold tracking-normal text-[rgb(var(--fg))]",
  "mt-4 mb-1.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-[rgb(var(--fg))] opacity-75",
  "mt-3 mb-1 text-sm font-semibold text-[rgb(var(--fg))] opacity-85",
];

const unorderedPattern = /^\s*[-*•]\s+/;

function processBlock(block: string, key: number): React.ReactNode[] {
  const lines = block.split("\n");
  const nodes: React.ReactNode[] = [];

  const headingMatch = lines[0].match(/^(#{1,3})\s+(.+)/);
  if (headingMatch) {
    const level = Math.min(headingMatch[1].length, 3) - 1;
    nodes.push(
      <p
        key={`h-${key}`}
        className={HEADING_CLASSES[level]}
        dangerouslySetInnerHTML={{ __html: inline(headingMatch[2]) }}
      />,
    );
    const body = lines.slice(1).join("\n").trim();
    if (body) nodes.push(...processBlock(body, key + 1000));
    return nodes;
  }

  if (/^[-*_]{3,}$/.test(lines[0].trim())) {
    nodes.push(<hr key={`hr-${key}`} className="my-3 border-[rgb(var(--border)/0.68)]" />);
    return nodes;
  }

  if (lines.some((line) => unorderedPattern.test(line))) {
    const firstListIndex = lines.findIndex((line) => unorderedPattern.test(line));
    const pre = lines.slice(0, firstListIndex).join("\n").trim();
    const listItems = lines.filter((line) => unorderedPattern.test(line));

    if (pre) {
      nodes.push(
        <p
          key={`pre-${key}`}
          className="mb-1.5 text-sm leading-relaxed opacity-90"
          dangerouslySetInnerHTML={{ __html: inline(pre) }}
        />,
      );
    }

    nodes.push(
      <ul key={`ul-${key}`} className="my-1 space-y-1.5">
        {listItems.map((line, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 flex-none rounded-full bg-brand-400" />
            <span className="opacity-90" dangerouslySetInnerHTML={{ __html: inline(line.replace(unorderedPattern, "")) }} />
          </li>
        ))}
      </ul>,
    );
    return nodes;
  }

  if (lines.some((line) => /^\s*\d+[.)]\s+/.test(line))) {
    nodes.push(
      <ol key={`ol-${key}`} className="my-1 space-y-1.5 pl-1">
        {lines.map((line, index) => {
          const match = line.match(/^\s*(\d+)[.)]\s+(.+)/);
          if (!match) return null;
          return (
            <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 min-w-[18px] shrink-0 text-xs font-bold text-brand-400">{match[1]}.</span>
              <span className="opacity-90" dangerouslySetInnerHTML={{ __html: inline(match[2]) }} />
            </li>
          );
        })}
      </ol>,
    );
    return nodes;
  }

  if (lines[0].match(/^\*\*[^*]{1,40}\*\*[:\s]/)) {
    nodes.push(
      <p
        key={`bt-${key}`}
        className="mt-2 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: lines.map(inline).join(" ") }}
      />,
    );
    return nodes;
  }

  nodes.push(
    <p
      key={`p-${key}`}
      className="text-sm leading-relaxed opacity-90"
      dangerouslySetInnerHTML={{ __html: lines.map(inline).join("<br/>") }}
    />,
  );
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, index) => {
    const trimmed = block.trim();
    if (trimmed) nodes.push(...processBlock(trimmed, index));
  });

  return <div className="space-y-1.5 leading-relaxed">{nodes}</div>;
}
