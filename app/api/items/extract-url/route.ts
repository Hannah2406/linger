import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { extractItem } from "@/lib/scraping/dispatch";

const Body = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const result = await extractItem(body.url);
  return NextResponse.json(result);
}
