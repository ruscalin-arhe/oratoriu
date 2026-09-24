import { currentUser } from "./current-user";

export async function requireAdmin() {
  const user = await currentUser();
  if (user.role !== "ADMIN") {
    throw new Error("Doar administratorul are acces.");
  }
  return user;
}
