"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCalm } from "@/child/ui/useCalm";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import styles from "./onboarding.module.css";

// A short burst of the brand companions (approved art) flying out of a fresh choice and fading (D-069).
// Changing `burst` plays it once; 0 shows nothing. Off with reduced motion.
const BITS: { id: AssetId; x: number; y: number; r: number }[] = [
  { id: "companion_star", x: -1, y: -1, r: -25 },
  { id: "companion_heart", x: 1, y: -0.8, r: 20 },
  { id: "companion_cloud", x: 0.2, y: -1.3, r: 0 },
  { id: "companion_star", x: 1.1, y: 0.2, r: 35 },
];

export function Sparkles({ burst }: { burst: number }) {
  const reduce = useCalm();
  if (reduce || !burst) return null;
  return (
    <span className={styles.sparkles} aria-hidden>
      <AnimatePresence>
        {BITS.map((b, i) => (
          <motion.span
            key={`${burst}-${i}`}
            className={styles.sparkle}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
            animate={{ x: `${b.x * 280}%`, y: `${b.y * 260}%`, scale: [0.2, 1.1, 0.9], opacity: [0, 1, 0], rotate: b.r }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.05 }}
          >
            <AssetImage id={b.id} alt="" sizes="64px" />
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
