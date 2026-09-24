import { redirect } from "next/navigation";
import { getAdminSession } from "@/auth";

/** /admin — вход: авторизованный попадает к объектам, остальные — на форму входа. */
export default async function AdminIndexPage() {
  const session = await getAdminSession();
  redirect(session ? "/admin/objects" : "/admin/login");
}
