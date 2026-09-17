import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/portal" : "/login");
}
