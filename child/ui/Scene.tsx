import type { ReactNode } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import styles from "./ui.module.css";

/**
 * A full-screen scene from Feelio's world (DESIGN_SYSTEM §5). The landscape and portrait art are both
 * in the page and CSS shows the one that matches the device orientation. Art is never mirrored for
 * RTL: the layout on top of it flips instead.
 */
export function Scene({
  land,
  port,
  alt,
  children,
  testId,
}: {
  land: AssetId;
  port: AssetId;
  alt: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <main className={styles.scene} data-testid={testId}>
      <div className={styles.sceneBg} data-orient="land">
        <AssetImage id={land} alt={alt} sizes="100vw" className={styles.sceneImg} priority />
      </div>
      <div className={styles.sceneBg} data-orient="port">
        <AssetImage id={port} alt={alt} sizes="100vw" className={styles.sceneImg} priority />
      </div>
      {children}
    </main>
  );
}
