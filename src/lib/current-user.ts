import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function currentUser() {
  const jar = await cookies();
  const email =
    jar.get("oratoriu_email")?.value || process.env.DEV_USER_EMAIL;

  if (!email) throw new Error("Nimeni nu e logat.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User inexistent: ${email}`);
  return user;
}
