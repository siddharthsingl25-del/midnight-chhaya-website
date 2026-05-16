"use client";

/**
 * Page transition wrapper.
 * In App Router, `template.tsx` re-renders on every navigation (unlike
 * `layout.tsx` which persists), making it the right place for entry
 * animations. Each route fades + rises in cinematically.
 */

import { motion } from "framer-motion";
import { easeCinematic } from "@/lib/animations";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeCinematic }}
    >
      {children}
    </motion.div>
  );
}
