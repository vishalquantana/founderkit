import "dotenv/config";
import { getUserByEmail } from "@/db/queries/users";
import { createWorkshop } from "@/db/queries/workshops";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "vishal@quantana.com.au";
  const owner = await getUserByEmail(email);
  if (!owner) throw new Error(`No admin ${email} — run seed:admin first.`);
  const name = process.argv[2] ?? "Tripura Founder Workshop";
  const w = await createWorkshop({ ownerId: owner.id, name });
  console.log(`Created workshop "${w.name}" — join code: ${w.joinCode}`);
  console.log(`Landing URL path: /w/${w.joinCode}`);
}

main().then(() => process.exit(0));
