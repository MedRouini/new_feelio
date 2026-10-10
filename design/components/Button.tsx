import type { ButtonHTMLAttributes } from "react";
import styles from "./components.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quietDanger";
  /** Parent area only; child screens use child/ui ThingButton. */
  size?: "parent";
};

export function Button({ variant = "primary", size = "parent", className, ...rest }: Props) {
  return <button {...rest} className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")} />;
}
