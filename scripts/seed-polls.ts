import "dotenv/config";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { listPolls, createPoll } from "@/db/queries/polls";

// Vamshi's live-poll questions (Tripura Founder Workshop).
// Positions 1–3 run at the start; 4–5 just before the Lean Canvas.
const QUESTIONS: { question: string; options: string[] }[] = [
  {
    question: "What stage is your startup currently at?",
    options: [
      "Just an idea",
      "Problem discovery / talking to users",
      "Prototype or MVP being built",
      "MVP launched with users",
      "Paying customers / scaling",
    ],
  },
  {
    question: "What is your current funding scenario?",
    options: [
      "Bootstrapped / self-funded",
      "Friends & family funded",
      "Grants / incubator support",
      "Angel / seed funded",
      "Actively looking to raise",
    ],
  },
  {
    question: "What is your current team size?",
    options: [
      "Solo founder",
      "2–3 core team members",
      "4–10 members",
      "10+ members",
      "Still looking for co-founder / team",
    ],
  },
  {
    question: "What is your strongest payment proof so far?",
    options: [
      "Zero revenue / not tested payment yet",
      "Users interested, but no one has paid",
      "Few paying customers / paid pilots",
      "Repeat purchases / renewals",
      "Referrals or customers asking for expansion",
    ],
  },
  {
    question: "What is your biggest current challenge?",
    options: [
      "Problem/customer clarity",
      "Building the right MVP",
      "Getting first users",
      "Getting customers to pay",
      "Funding, team, or execution bandwidth",
    ],
  },
];

const CODE = process.env.SEED_POLL_CODE ?? "H2D3G9";

async function main() {
  const ws = await getWorkshopByJoinCode(CODE);
  if (!ws) throw new Error(`Workshop with join code ${CODE} not found`);

  const existing = await listPolls(ws.id);
  if (existing.length > 0) {
    console.log(`Workshop "${ws.name}" already has ${existing.length} poll(s); skipping seed.`);
    return;
  }

  let position = 1;
  for (const q of QUESTIONS) {
    await createPoll({ workshopId: ws.id, question: q.question, options: q.options, position });
    position += 1;
  }
  console.log(`Seeded ${QUESTIONS.length} sample polls into "${ws.name}" (${CODE}).`);
}

main().then(() => process.exit(0));
