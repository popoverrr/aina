/**
 * Минимальный безопасный рендер markdown-подобного текста в React-узлы:
 * абзацы, списки (- / •), заголовки (##), **жирный**. Ссылки и HTML не поддерживаются намеренно —
 * описания объектов пишет один человек в админке, а XSS-поверхность нам не нужна.
 */
import { createElement, Fragment, type ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return createElement("strong", { key: `${keyPrefix}-${i}` }, part.slice(2, -2));
    }
    return createElement(Fragment, { key: `${keyPrefix}-${i}` }, part);
  });
}

export function renderMarkdown(source: string): ReactNode[] {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    if (lines.every((l) => /^([-*•]|\d+\.)\s+/.test(l))) {
      const ordered = /^\d+\./.test(lines[0] ?? "");
      nodes.push(
        createElement(
          ordered ? "ol" : "ul",
          { key: `b${bi}` },
          lines.map((l, li) => createElement("li", { key: li }, inline(l.replace(/^([-*•]|\d+\.)\s+/, ""), `b${bi}l${li}`))),
        ),
      );
      return;
    }

    const first = lines[0] ?? "";
    if (/^#{2,3}\s+/.test(first) && lines.length === 1) {
      const level = first.startsWith("###") ? "h3" : "h2";
      nodes.push(createElement(level, { key: `b${bi}` }, first.replace(/^#{2,3}\s+/, "")));
      return;
    }

    nodes.push(
      createElement(
        "p",
        { key: `b${bi}` },
        lines.flatMap((l, li) => (li === 0 ? inline(l, `b${bi}l${li}`) : [createElement("br", { key: `br${li}` }), ...inline(l, `b${bi}l${li}`)])),
      ),
    );
  });

  return nodes;
}
