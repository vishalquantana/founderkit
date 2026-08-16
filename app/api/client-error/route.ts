import { NextResponse } from "next/server";
import { sendSlackErrorAlert } from "@/lib/slack-logger";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    await sendSlackErrorAlert({
      source: "frontend",
      error: body.error || "Unknown client error",
      url: body.url,
      digest: body.digest,
      context: {
        stack: body.stack,
        ...body.context,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
