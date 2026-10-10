import type { ReactNode } from "react";
import styles from "./components.module.css";

export function Card({ children, as: Tag = "section", className }: { children: ReactNode; as?: "section" | "div" | "article"; className?: string }) {
  return <Tag className={[styles.card, className].filter(Boolean).join(" ")}>{children}</Tag>;
}
