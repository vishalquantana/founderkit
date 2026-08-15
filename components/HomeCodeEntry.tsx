"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export function HomeCodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/w/${c}`);
  }

  return (
    <form onSubmit={go} className="mt-2 flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="e.g. H2D3G9"
        autoCapitalize="characters"
        className="w-full rounded-xl border border-[#e9e2d8] bg-white px-3 py-3 font-mono tracking-widest outline-none focus:border-[#6b1f9c]"
      />
      <motion.button
        type="submit"
        whileTap={{ scale: 0.96 }}
        className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
      >
        Start
      </motion.button>
    </form>
  );
}
