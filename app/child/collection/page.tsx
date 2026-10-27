import { redirect } from "next/navigation";

// The collection became My room (D-074).
export default function Collection() {
  redirect("/room");
}
