import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./components.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; name: string };

export function Field({ label, hint, name, id, ...rest }: Props) {
  const inputId = id ?? `f-${name}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} name={name} aria-describedby={hintId} {...rest} />
      {hint ? <small id={hintId}>{hint}</small> : null}
    </div>
  );
}
