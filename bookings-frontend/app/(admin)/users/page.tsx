import { getUsers } from "@/lib/api";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const users = await getUsers().catch(() => []);
  return <UsersClient initialUsers={users} />;
}
