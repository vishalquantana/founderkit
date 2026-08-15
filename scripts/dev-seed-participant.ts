import "dotenv/config";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { createParticipant, completeParticipant } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import type { SectionKey } from "@/db/schema";

const ANSWERS: { section: SectionKey; mainAnswer: string }[] = [
  { section: "problem", mainAnswer: "For small kirana stores in Tier-2 towns, losing repeat customers to quick-commerce apps reduces daily sales by 15-20% and weakens their relationship with neighbourhood buyers. They have no easy way to run loyalty or reorders." },
  { section: "customer", mainAnswer: "End user is the shopkeeper who runs the counter. The store owner pays (often the same person for small shops, but a family elder for larger ones). A trusted local distributor influences which tools they adopt. The owner can block adoption if it feels like extra work." },
  { section: "value", mainAnswer: "Shopkeepers care because repeat orders are their lifeline. We charge Rs 299/month. Two shops have pre-committed to pay after a 2-week trial. They will renew if reorders visibly increase; the WhatsApp reorder nudge is the hook." },
  { section: "mvp", mainAnswer: "A WhatsApp concierge MVP: we manually send reorder reminders to a shop's top 20 customers and track responses. Tests the riskiest assumption — will customers reorder from a nudge. The dashboard and automation can wait." },
  { section: "distribution", mainAnswer: "First 10 users are shops within 2 km of my home market that I visit in person. I reach them through the local distributor who already trusts me. First conversion action: a free 2-week concierge trial signup on the spot." },
  { section: "proof", mainAnswer: "Spoke to 12 shopkeepers; 2 are running paid pilots at Rs 299. One referred a neighbouring shop. Surprise: they cared more about reorder reminders than about a full billing app, which we had assumed was the main draw." },
];

async function main() {
  const code = process.argv[2] ?? "H2D3G9";
  const w = await getWorkshopByJoinCode(code);
  if (!w) throw new Error(`No workshop ${code}`);
  const p = await createParticipant({
    workshopId: w.id, founderName: "Asha Rao", startupName: "KiranaLoop",
    contact: "asha@example.com", sector: "Retail tech", stage: "mvp_launched",
    teamSize: "2", productType: "b2b", businessModel: "subscription", consentFollowup: true,
  });
  for (const a of ANSWERS) await saveResponse({ participantId: p.id, ...a });
  await completeParticipant(p.id);
  console.log(`Seeded participant ${p.id}`);
  console.log(`Result path: /w/${code}/result/${p.id}`);
}

main().then(() => process.exit(0));
