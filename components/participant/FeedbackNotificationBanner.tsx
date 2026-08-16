"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { MessageSquareHeart, ArrowRight } from "lucide-react";
import type { WorkshopStateResponse } from "@/app/api/w/[code]/state/route";

export interface FeedbackNotificationBannerProps {
  code: string;
  pid: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FeedbackNotificationBanner({ code, pid }: FeedbackNotificationBannerProps) {
  const { data } = useSWR<WorkshopStateResponse>(`/api/w/${code}/state`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
  });

  const [dismissed, setDismissed] = useState(false);

  if (!data?.feedbackPrompted || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white shadow-md animate-in slide-in-from-top duration-300">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <MessageSquareHeart className="h-5 w-5 shrink-0 text-purple-200" />
          <span>The presenter has invited you to submit workshop feedback!</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/w/${code}/feedback/${pid}`}
            className="rounded-lg bg-white px-3 py-1.5 font-bold text-purple-700 hover:bg-purple-50 transition-colors shadow-sm text-xs inline-flex items-center gap-1"
          >
            Submit Feedback
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-purple-200 hover:text-white text-xs px-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
