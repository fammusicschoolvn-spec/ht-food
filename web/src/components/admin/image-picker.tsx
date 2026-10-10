"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MAX_SIDE = 1600;

// Thu nhỏ ảnh ngay trên máy trước khi gửi: ảnh chụp gốc vài MB sẽ còn vài trăm KB.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", await shrink(file), "anh.jpg");
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Tải ảnh lên không thành công.");
  return json.url;
}

/**
 * Chọn ảnh cho form quản trị. `multiple` = nhiều ảnh (gửi lên dạng JSON),
 * không thì một ảnh (gửi lên đúng đường dẫn).
 */
export function ImagePicker({
  name,
  initial,
  multiple = false,
}: {
  name: string;
  initial: string[];
  multiple?: boolean;
}) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const url = await upload(file);
        setImages((list) => (multiple ? [...list, url].slice(0, 8) : [url]));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải ảnh lên không thành công.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const makeMain = (i: number) => setImages((list) => [list[i], ...list.filter((_, j) => j !== i)]);
  const remove = (i: number) => setImages((list) => list.filter((_, j) => j !== i));

  return (
    <div>
      <input type="hidden" name={name} value={multiple ? JSON.stringify(images) : (images[0] ?? "")} />

      {images.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-4">
          {images.map((src, i) => (
            <li key={src} className="w-32">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-ivory">
                <Image src={src} alt={`Ảnh ${i + 1}`} fill sizes="128px" className="object-cover" />
                {multiple && i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-forest-800 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
                    Ảnh chính
                  </span>
                )}
              </div>
              {multiple && (
                <div className="mt-1.5 flex flex-col gap-1">
                  {i > 0 && (
                    <button type="button" onClick={() => makeMain(i)} className="a-btn a-btn-ghost min-h-9 px-2 text-xs">
                      Đặt làm ảnh chính
                    </button>
                  )}
                  <button type="button" onClick={() => remove(i)} className="a-btn a-btn-danger min-h-9 px-2 text-xs">
                    Gỡ ảnh
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <label className={`a-btn a-btn-ghost ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? "Đang tải ảnh lên…" : multiple ? "Thêm ảnh" : "Đổi ảnh"}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          disabled={busy}
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
