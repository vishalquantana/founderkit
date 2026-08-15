import "dotenv/config";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { createParticipant, completeParticipant } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import { maybeEmailResult } from "@/email/send-result";
import { hasSendgrid } from "@/email/sendgrid";
import type { SectionKey } from "@/db/schema";

const ANSWERS: { section: SectionKey; mainAnswer: string }[] = [
  { section: "problem", mainAnswer: "For small kirana stores in Tier-2 towns, losing repeat customers to quick-commerce apps reduces daily sales by 15-20% and weakens neighbourhood ties." },
  { section: "customer", mainAnswer: "End user is the shopkeeper; the store owner pays; a trusted local distributor influences adoption; the owner can block it if it feels like extra work." },
  { section: "value", mainAnswer: "Rs 299/month. Two shops pre-committed after a 2-week trial. They renew if reorders visibly increase." },
  { section: "mvp", mainAnswer: "A WhatsApp concierge MVP: manually send reorder reminders to a shop's top 20 customers and track responses." },
  { section: "distribution", mainAnswer: "First 10 users are shops within 2km I visit in person, reached via the local distributor. First conversion: a free 2-week trial." },
  { section: "proof", mainAnswer: "Spoke to 12 shopkeepers; 2 paid pilots at Rs 299; one referral. Surprise: they cared more about reorder reminders than a full billing app." },
];

async function main() {
  console.log("hasSendgrid:", hasSendgrid());
  const to = process.argv[2] ?? "vishal@quantana.com.au";
  const w = await getWorkshopByJoinCode("H2D3G9");
  if (!w) throw new Error("workshop missing");
  const p = await createParticipant({
    workshopId: w.id, founderName: "Email Test", startupName: "KiranaLoop",
    contact: to, stage: "mvp_launched", productType: "b2b", businessModel: "subscription",
    consentFollowup: true,
  });
  for (const a of ANSWERS) await saveResponse({ participantId: p.id, ...a });
  await completeParticipant(p.id);
  console.log(`participant ${p.id}, sending founder email to ${to} ...`);
  await maybeEmailResult(p.id);
  console.log("maybeEmailResult finished (check the inbox).");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
