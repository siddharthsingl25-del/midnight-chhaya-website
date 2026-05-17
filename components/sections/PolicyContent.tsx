"use client";

/**
 * Renders the body of a policy page from a structured outline.
 * Use `{ type: "p", text }` for paragraphs, `{ type: "list", items }`
 * for bullet lists. Each block reveals on scroll.
 */

import type { ReactNode } from "react";
import Reveal from "@/components/animations/Reveal";

export type PolicyBlock =
  | { type: "p"; text: ReactNode }
  | { type: "list"; items: ReactNode[] }
  | { type: "h"; text: string };

export default function PolicyContent({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {blocks.map((block, i) => {
          if (block.type === "h") {
            return (
              <Reveal key={i} delay={i * 0.02}>
                <h2 className="font-display uppercase text-bone text-xl md:text-2xl mt-6">
                  {block.text}
                </h2>
              </Reveal>
            );
          }
          if (block.type === "list") {
            return (
              <Reveal key={i} delay={i * 0.02}>
                <ul className="list-none flex flex-col gap-3 font-body text-bone leading-relaxed pl-0">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="text-gold mt-[8px] block h-1 w-1 rounded-full bg-gold flex-shrink-0" />
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          }
          return (
            <Reveal key={i} delay={i * 0.02}>
              <p className="font-body text-bone leading-relaxed text-base md:text-lg">
                {block.text}
              </p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
