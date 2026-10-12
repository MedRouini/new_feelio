import { notFound } from "next/navigation";
import { openBook } from "@/child/stories";
import { Heartbeat } from "../../Heartbeat";
import { TimeUp } from "../../TimeUp";
import { storiesChild } from "../guard";
import { Reader } from "./Reader";

// One storybook (D-070): only the child who owns it can open it (server-side check).
export default async function Book({ params }: { params: Promise<{ id: string }> }) {
  const { child, view } = await storiesChild();
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const book = await openBook(child.childId, id);
  if (!book) notFound();
  return (
    <>
      <Heartbeat />
      <main data-testid="storybook">
        <Reader book={book} narration={book.locale === "en"} />
      </main>
    </>
  );
}
