"use client";

/**
 * Inquiry form — currently UI-only. Submission stays client-side and just
 * flips to a "sent" state. Wire the `onSubmit` handler to your backend
 * (Formspree, Resend, /api/contact route, etc.) when ready.
 */

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { easeCinematic } from "@/lib/animations";
import { useMagnetic } from "@/lib/useMagnetic";

type State = "idle" | "sending" | "sent";

export default function InquiryForm() {
  const [state, setState] = useState<State>("idle");
  const { ref: magRef, x, y } = useMagnetic(8);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    // TODO: replace with real submission (fetch '/api/contact' or service).
    await new Promise((r) => setTimeout(r, 900));
    setState("sent");
  };

  return (
    <Reveal as="div" className="w-full">
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        <Field name="name"    label="Name"    autoComplete="name" />
        <Field name="email"   label="Email"   type="email" required autoComplete="email" />
        <Field name="piece"   label="Piece (optional)" placeholder="e.g. Crow Talon Ring" className="sm:col-span-2" />
        <Field name="message" label="Message" multiline className="sm:col-span-2" required />

        <div className="sm:col-span-2 flex items-center justify-between gap-6 pt-2">
          <p className="font-serif italic text-bone-dim text-sm max-w-md">
            We reply by hand. Allow a day or two — we are usually at the bench.
          </p>
          <motion.div ref={magRef} style={{ x, y }} className="inline-block">
            <button
              type="submit"
              disabled={state !== "idle"}
              data-cursor={state === "sent" ? "Sent" : "Send"}
              data-cursor-magnetic
              className="group relative inline-flex items-center gap-3 px-8 py-4 min-w-[200px] justify-center
                         border border-gold/60 text-gold
                         transition-colors duration-500
                         hover:bg-gold hover:text-ink
                         hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.55)]
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={state}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: easeCinematic }}
                  className="eyebrow flex items-center gap-2"
                >
                  {state === "idle" && "Send inquiry"}
                  {state === "sending" && "Sending…"}
                  {state === "sent" && (
                    <>
                      <Check size={14} strokeWidth={1.5} /> Received
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </motion.div>
        </div>
      </form>
    </Reveal>
  );
}

function Field({
  name,
  label,
  type = "text",
  multiline = false,
  className = "",
  required = false,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  multiline?: boolean;
  className?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const shared =
    "peer w-full bg-transparent border-b border-bone/20 px-1 py-3 font-body text-bone " +
    "focus:outline-none focus:border-gold transition-colors duration-500";

  return (
    <label className={`relative block ${className}`}>
      <span className="eyebrow block mb-2 text-bone-dim">
        {label} {required ? <span className="text-oxblood/80">·</span> : null}
      </span>
      {multiline ? (
        <textarea
          name={name}
          required={required}
          rows={5}
          placeholder={placeholder}
          className={`${shared} resize-none`}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={shared}
        />
      )}
    </label>
  );
}
