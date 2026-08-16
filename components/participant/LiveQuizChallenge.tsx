"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  calculateQuizScore,
  personalityForScore,
  type Question,
  type Personality,
} from "@/lib/quiz";
import { ArrowLeft, CheckCircle2, Clock, Sparkles, Trophy, XCircle, Zap } from "lucide-react";

export function LiveQuizChallenge({
  code,
  pid,
  founderName,
  startupName,
}: {
  code: string;
  pid: string;
  founderName: string;
  startupName: string;
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "submitting" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load questions or check previous submission
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/w/${code}/quiz?pid=${pid}`);
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
        }
        if (data.submission) {
          setFinalScore(data.submission.score);
          setPersonality(personalityForScore(data.submission.score));
          setPhase("result");
        }
      } catch (e) {
        console.error("Failed to load quiz", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code, pid]);

  function startQuiz() {
    setPhase("playing");
    setCurrentIndex(0);
    setAnswers([]);
    setTimeLeft(60);
    setSelectedOption(null);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function finishQuiz(currentAnswers = answers) {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");

    const timeSpent = Math.min(60, Math.round((Date.now() - startTimeRef.current) / 1000));
    const calculated = calculateQuizScore(questions, currentAnswers);
    const badge = personalityForScore(calculated);

    setFinalScore(calculated);
    setPersonality(badge);

    try {
      await fetch(`/api/w/${code}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: pid,
          score: calculated,
          badgeTitle: badge.title,
          badgeKey: badge.key,
          timeTakenSeconds: timeSpent,
          responses: currentAnswers.map((picked, i) => ({
            qId: questions[i]?.id ?? i,
            picked,
            correct: picked === questions[i]?.answer,
          })),
        }),
      });
    } catch (e) {
      console.error("Failed to submit score", e);
    }

    try {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setPhase("result");
  }

  function handleSelectOption(optionIndex: number) {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    const updatedAnswers = [...answers, optionIndex];
    setAnswers(updatedAnswers);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length && timeLeft > 0) {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
      } else {
        finishQuiz(updatedAnswers);
      }
    }, 450);
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6 text-center text-muted">
        Loading AI Showdown Challenge…
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center p-4 sm:p-6">
      <div className="mb-4">
        <Link
          href={`/w/${code}/home/${pid}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Founder Home</span>
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pulse-card relative overflow-hidden p-6 sm:p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6,#f472b6)] text-white shadow-lg">
              <Zap className="h-8 w-8" />
            </div>

            <p className="pulse-kicker text-xs uppercase tracking-widest font-bold">Live AI Showdown</p>
            <h1 className="font-display text-gradient mt-1 text-2xl sm:text-3xl font-black">
              60-Second AI Challenge
            </h1>
            <p className="mt-2 text-sm text-muted">
              10 rapid-fire questions on AI, prompt engineering, and lean startup validation. Fast answers earn big points on the room leaderboard!
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Time Limit</span>
                <span className="text-sm font-bold text-foreground">60 Seconds Total</span>
              </div>
              <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3">
                <span className="text-[10px] uppercase font-bold text-muted block">Scoring</span>
                <span className="text-sm font-bold text-foreground">+10 Correct / -2 Wrong</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startQuiz}
              className="pulse-btn mt-8 w-full py-3.5 text-sm font-black tracking-wide"
            >
              Start 60s Challenge ⚡
            </button>
          </motion.div>
        )}

        {phase === "playing" && questions[currentIndex] && (
          <motion.div
            key={`q-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="pulse-card flex flex-col gap-6 p-6 sm:p-8"
          >
            {/* Top Bar: Progress & Timer */}
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-bold text-muted">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tabular-nums transition-colors ${
                  timeLeft <= 10
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                    : "bg-surface-strong text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Timer Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
              <motion.div
                className="h-full bg-[linear-gradient(135deg,#8b5cf6,#f472b6)]"
                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>

            {/* Question Text */}
            <h2 className="font-display text-lg sm:text-xl font-bold leading-snug text-foreground">
              {questions[currentIndex].question}
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {questions[currentIndex].options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrect = isSelected && i === questions[currentIndex].answer;
                const isWrong = isSelected && i !== questions[currentIndex].answer;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(i)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-red-500 bg-red-500/20 text-red-300"
                        : "border-[var(--pulse-border)] bg-surface hover:border-purple-500/40 hover:bg-surface-strong text-foreground"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pulse-card p-10 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 animate-spin">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">Calculating Score & Badge…</h3>
          </motion.div>
        )}

        {phase === "result" && personality && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="pulse-card relative overflow-hidden p-6 sm:p-8 text-center"
          >
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-xl"
              style={{
                background: `color-mix(in srgb, ${personality.color} 25%, transparent)`,
                border: `2px solid ${personality.color}`,
              }}
            >
              {personality.emoji}
            </div>

            <p className="pulse-kicker text-xs uppercase font-bold tracking-widest">Your AI Personality</p>
            <h2 className="font-display text-3xl font-black mt-1 text-foreground">
              {personality.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{personality.description}</p>

            <div className="my-6 rounded-2xl border border-[var(--pulse-border)] bg-surface p-5 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Final Showdown Score
              </span>
              <span className="font-display text-gradient text-4xl sm:text-5xl font-black block mt-1">
                {finalScore} pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block">Top Strength</span>
                <p className="text-foreground mt-0.5">{personality.strength}</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <span className="font-bold text-purple-900 dark:text-purple-300 block">Growth Move</span>
                <p className="text-foreground mt-0.5">{personality.opportunity}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href={`/w/${code}/home/${pid}`}
                className="pulse-btn w-full py-3 text-xs font-bold"
              >
                Back to Founder Dashboard →
              </Link>
              <button
                type="button"
                onClick={startQuiz}
                className="pulse-btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Retake Challenge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
