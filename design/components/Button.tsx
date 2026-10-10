import type { ButtonHTMLAttributes } from "react";
import styles from "./components.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quietDanger";
  size?: "child" | "parent";
};

export function Button({ variant = "primary", size = "parent", className, ...rest }: Props) {
  return <button {...rest} className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")} />;
}
