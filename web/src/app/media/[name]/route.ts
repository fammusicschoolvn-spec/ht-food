import { readUpload } from "@/lib/store";

export async function GET(_: Request, ctx: RouteContext<"/media/[name]">) {
  const { name } = await ctx.params;
  const data = await readUpload(name);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
