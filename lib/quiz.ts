export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  difficulty: Difficulty;
};

export const QUESTION_POOL: Question[] = [
  {
    id: 1,
    question: "What does an LLM actually do when it answers you?",
    options: [
      "Searches the internet live",
      "Predicts the most likely next tokens",
      "Runs a database query",
      "Copies a stored answer",
    ],
    answer: 1,
    difficulty: "medium",
  },
  {
    id: 2,
    question: "Your AI confidently invents a fake statistic. That's called…",
    options: ["Overfitting", "Hallucination", "Fine-tuning", "Latency"],
    answer: 1,
    difficulty: "easy",
  },
  {
    id: 3,
    question: "Which prompt gets the best output?",
    options: [
      '"Write something about sales"',
      '"Be creative, surprise me"',
      '"Write a 3-line follow-up email to a CFO who ghosted us"',
      '"Sales email pls"',
    ],
    answer: 2,
    difficulty: "medium",
  },
  {
    id: 4,
    question: "RAG is mostly used to…",
    options: [
      "Ground answers in your own documents",
      "Make models faster",
      "Compress images",
      "Replace prompts entirely",
    ],
    answer: 0,
    difficulty: "medium",
  },
  {
    id: 5,
    question: "What makes an AI 'agent' different from a chatbot?",
    options: [
      "It speaks more politely",
      "It takes actions and uses tools to reach a goal",
      "It has a bigger context window",
      "It runs on your laptop",
    ],
    answer: 1,
    difficulty: "medium",
  },
  {
    id: 6,
    question: "Best first AI use-case for an early startup team?",
    options: [
      "The highest-volume, lowest-risk repetitive task",
      "The CEO's favourite moonshot",
      "Replacing the whole support team",
      "Anything with a demo video",
    ],
    answer: 0,
    difficulty: "medium",
  },
  {
    id: 7,
    question: "'Context window' means…",
    options: [
      "How long the model has existed",
      "How much text the model can consider at once",
      "The UI panel of the chat",
      "The training dataset size",
    ],
    answer: 1,
    difficulty: "easy",
  },
  {
    id: 8,
    question: "Which is the biggest real risk when shipping AI at work?",
    options: [
      "Robots taking over",
      "Leaking sensitive data into the wrong tool",
      "Models being too polite",
      "Too many emojis",
    ],
    answer: 1,
    difficulty: "easy",
  },
  {
    id: 9,
    question: "Your AI output is 80% right. Smartest next move?",
    options: [
      "Ship it and hope",
      "Abandon AI entirely",
      "Add a human review step and tighten the prompt",
      "Ask the model if it's sure",
    ],
    answer: 2,
    difficulty: "medium",
  },
  {
    id: 10,
    question: "Which one is a genuine sign of AI maturity in a company?",
    options: [
      "An AI policy nobody reads",
      "Measured workflows where AI saves real hours",
      "A ChatGPT licence for everyone",
      "An AI slide in every deck",
    ],
    answer: 1,
    difficulty: "medium",
  },
  {
    id: 11,
    question: "What does GPT stand for?",
    options: [
      "Generative Pre-trained Transformer",
      "General Purpose Technology",
      "Global Processing Tool",
      "Graphic Processing Terminal",
    ],
    answer: 0,
    difficulty: "easy",
  },
  {
    id: 12,
    question: "Which company created ChatGPT?",
    options: ["OpenAI", "Google", "Meta", "Microsoft"],
    answer: 0,
    difficulty: "easy",
  },
  {
    id: 13,
    question: "What is a 'temperature' parameter in AI models?",
    options: [
      "How hot the GPU server runs",
      "The randomness / creativity of generated answers",
      "The speed of generation",
      "The language vocabulary limit",
    ],
    answer: 1,
    difficulty: "medium",
  },
  {
    id: 14,
    question: "What is few-shot prompting?",
    options: [
      "Asking the model multiple times quickly",
      "Providing 2-3 input/output examples in the prompt",
      "Using only short 5-word prompts",
      "Running the model on low power",
    ],
    answer: 1,
    difficulty: "medium",
  },
  {
    id: 15,
    question: "Why should you build proof before code in an MVP?",
    options: [
      "Investors only care about Figma designs",
      "To validate real user pain and willingness to pay before wasting dev time",
      "Because AI can code everything automatically",
      "Because software patents take too long",
    ],
    answer: 1,
    difficulty: "easy",
  },
];

export type BadgeKey =
  | "pioneer"
  | "explorer"
  | "learner"
  | "starter"
  | "prof"
  | "topper"
  | "glober"
  | "dcp";

export type Personality = {
  key: BadgeKey;
  emoji: string;
  title: string;
  description: string;
  strength: string;
  opportunity: string;
  color: string;
};

export const PERSONALITIES: Record<string, Personality> = {
  pioneer: {
    key: "pioneer",
    emoji: "🏆",
    title: "AI Pioneers",
    description: "Deeply integrating AI workflows, reasoning models, and agents into startup execution.",
    strength: "AI Adoption & Systems Architecture",
    opportunity: "Scale Multi-Agent Automations",
    color: "#f4c748",
  },
  explorer: {
    key: "explorer",
    emoji: "🚀",
    title: "AI Explorers",
    description: "Actively building prompt experiments, testing LLM tools, and shipping fast.",
    strength: "Practical Execution & Prototyping",
    opportunity: "Deepen Systematic Workflows",
    color: "#34d399",
  },
  learner: {
    key: "learner",
    emoji: "💡",
    title: "AI Learners",
    description: "Strong understanding of core AI concepts. Turning knowledge into hands-on MVP prototypes.",
    strength: "Prompting & Product Vision",
    opportunity: "Tighten MVP Feedback Loops",
    color: "#38bdf8",
  },
  starter: {
    key: "starter",
    emoji: "🌱",
    title: "AI Starters",
    description: "Beginning the AI journey. Exploring prompting fundamentals and modern AI tooling.",
    strength: "Curiosity & Rapid Learning",
    opportunity: "Build & Test First AI Workflow",
    color: "#c084fc",
  },
};

// Backward-compatible legacy aliases for previously saved database records
PERSONALITIES.prof = PERSONALITIES.pioneer;
PERSONALITIES.topper = PERSONALITIES.explorer;
PERSONALITIES.glober = PERSONALITIES.learner;
PERSONALITIES.dcp = PERSONALITIES.starter;

export const QUIZ_DURATION_SECONDS = 60;
export const QUESTION_COUNT = 10;

/**
 * Builds a shuffled set of 10 questions for a 60-second rapid quiz.
 */
export function buildQuizQuestions(): Question[] {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTION_COUNT);
}

export function calculateQuizScore(questions: Question[], answers: (number | null)[]): number {
  return answers.reduce<number>((total, answer, index) => {
    if (answer === null || answer === undefined) return total;
    return total + (answer === questions[index]?.answer ? 10 : -2);
  }, 0);
}

export function personalityForScore(score: number): Personality {
  if (score >= 80) return PERSONALITIES.pioneer;
  if (score >= 60) return PERSONALITIES.explorer;
  if (score >= 35) return PERSONALITIES.learner;
  return PERSONALITIES.starter;
}

export function personalityForBadge(badgeKeyOrTitle: string): Personality {
  const key = badgeKeyOrTitle?.toLowerCase()?.trim();
  if (PERSONALITIES[key]) return PERSONALITIES[key];
  const byTitle = Object.values(PERSONALITIES).find(
    (p) => p.title.toLowerCase() === key,
  );
  return byTitle ?? PERSONALITIES.starter;
}
