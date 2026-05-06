import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "unsupported type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("item-photos")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bucket is private — return a signed URL valid for 1 year.
  const { data: signed, error: signedErr } = await supabase.storage
    .from("item-photos")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedErr || !signed) {
    return NextResponse.json(
      { error: signedErr?.message ?? "failed to sign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signed.signedUrl, path });
}
