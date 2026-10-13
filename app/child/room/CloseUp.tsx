"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCalm } from "@/child/ui/useCalm";
import styles from "./room.module.css";

/** A room object grown into a full-screen close-up (shared layout from the object; a fade when calm). */
export function CloseUp({ id, title, backLabel, rtl, onClose, children }: { id: string; title: string; backLabel: string; rtl: boolean; onClose: () => void; children: React.ReactNode }) {
  const calm = useCalm();
  const Back = rtl ? ArrowRight : ArrowLeft;
  return (
    <motion.section
      className={styles.closeUp}
      layoutId={calm ? undefined : `room-${id}`}
      initial={calm ? { opacity: 0 } : undefined}
      animate={calm ? { opacity: 1 } : undefined}
      exit={calm ? { opacity: 0 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      aria-label={title}
      data-testid={`closeup-${id}`}
    >
      <button type="button" className={styles.back} onClick={onClose} aria-label={backLabel} data-testid="closeup-back">
        <Back size={34} strokeWidth={3} aria-hidden />
      </button>
      <motion.div className={styles.closeUpBody} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: calm ? 0 : 0.18 } }}>
        {children}
      </motion.div>
    </motion.section>
  );
}
