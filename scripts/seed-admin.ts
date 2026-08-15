import "dotenv/config";
import { getUserByEmail, createUser } from "@/db/queries/users";
import { hashPassword } from "@/lib/passwords";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "vishal@quantana.com.au";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  if (await getUserByEmail(email)) {
    console.log(`Admin ${email} already exists.`);
    return;
  }
  await createUser({ email, name: "Presenter", passwordHash: await hashPassword(password) });
  console.log(`Seeded admin ${email}.`);
}

main().then(() => process.exit(0));
