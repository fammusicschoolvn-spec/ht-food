import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/store";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Phiên đăng nhập đã hết. Hãy đăng nhập lại." }, { status: 401 });
  }
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "File không phải là ảnh." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Ảnh lớn hơn 8MB." }, { status: 413 });
  }
  try {
    const webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const url = await saveUpload(`${randomUUID()}.webp`, webp);
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Không đọc được ảnh này." }, { status: 400 });
  }
}
