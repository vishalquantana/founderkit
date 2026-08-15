import type { SectionKey } from "@/db/schema";
import { MVP_TYPE_OPTIONS } from "./options";

export type Section = {
  key: SectionKey; step: number; heading: string; mainQuestion: string;
  promptHelp?: string; example?: string; keyLine?: string; chips?: { value: string; label: string }[];
};

export const SECTIONS: Section[] = [
  {
    key: "problem", step: 1, heading: "What painful problem are you solving?",
    mainQuestion: "Describe the exact problem your startup is solving.",
    promptHelp: "Try this format: For [specific user], [specific problem] causes [specific pain or loss].",
    example: "For small kirana stores, losing repeat customers to online apps reduces daily sales and weakens their relationship with neighbourhood buyers.",
  },
  {
    key: "customer", step: 2, heading: "Who uses, pays, influences, and blocks?",
    mainQuestion: "Who is the end user? Who pays? Who influences the decision? Who can block adoption?",
    promptHelp: "In many startups, these are different people. Getting this wrong means you may pitch to the wrong audience.",
    example: "In Batplus, the player used the product, the parent often paid, the coach influenced adoption, and the academy owner controlled access.",
  },
  {
    key: "value", step: 3, heading: "Will someone pay, repeat, renew, or refer?",
    mainQuestion: "Why will customers care enough to use this? Who will pay? Have you tested willingness to pay? What will make them come back or renew?",
    promptHelp: "A first sale may come from curiosity. Repeat usage or renewal shows real value.",
    keyLine: "Acquisition is applause. Renewal is proof.",
  },
  {
    key: "mvp", step: 4, heading: "What is the smallest thing you can test?",
    mainQuestion: "What MVP are you planning to build? What assumption does it test? What can be manual? What can wait?",
    promptHelp: "MVP is not a mini version of your dream product. MVP is an experiment to test the riskiest assumption.",
    chips: MVP_TYPE_OPTIONS,
  },
  {
    key: "distribution", step: 5, heading: "How will you reach your first 10 users?",
    mainQuestion: "Who are your first 10 users? How will you reach them? Why will they trust you? What is your first conversion action?",
    promptHelp: 'Do not write "social media marketing" unless you know the exact audience, message, and channel.',
    keyLine: "AI makes building easier. It does not make distribution easier.",
  },
  {
    key: "proof", step: 6, heading: "What evidence do you already have?",
    mainQuestion: "How many real users or customers have you spoken to? Have you shown a prototype, demo, or offer? Has anyone paid, subscribed, repeated, referred, or committed? What surprised you from customer feedback?",
    promptHelp: "Compliments are not proof. Behaviour is proof.",
  },
];

const BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<SectionKey, Section>;
export function getSection(key: SectionKey): Section {
  return BY_KEY[key];
}
