/**
 * POST /api/admin/upload
 *
 * Receives a multipart/form-data file from the admin UI, uploads it to
 * the `media` Supabase Storage bucket, and returns the public URL.
 *
 * Requires the admin cookie. Filenames are randomised to avoid clashes
 * and to keep URLs stable + non-guessable.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "media";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Bad form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  // Pick a safe extension from the type, randomise the basename.
  const ext =
    file.type === "image/jpeg" ? "jpg" :
    file.type === "image/png"  ? "png" :
    file.type === "image/webp" ? "webp" :
    file.type === "image/gif"  ? "gif"  :
    "bin";
  const basename = crypto.randomBytes(10).toString("hex");
  // folder by category from query param (optional)
  const folder =
    form.get("folder") instanceof File
      ? "misc"
      : ((form.get("folder") as string) || "misc")
          .replace(/[^a-z0-9-]/gi, "")
          .slice(0, 24) || "misc";
  const path = `${folder}/${basename}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());

  const sb = supabaseAdmin();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}
