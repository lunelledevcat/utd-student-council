"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createUploadUrl, finalizeUpload } from "@/app/[locale]/dashboard/actions";
import type { FormPhoto } from "@/lib/admin/data";
import { IconChevronLeft, IconChevronRight, IconClose, IconImages } from "@/components/icons/Icon";
import { cn } from "@/lib/utils";

/** Signed URL -> PUT the original to private storage -> server re-encodes it. Returns the new photo or an error key. */
async function uploadOne(file: File): Promise<FormPhoto | { error: string; values?: Record<string, number> }> {
  const u = await createUploadUrl();
  if (!u.ok || !u.url || !u.path) return u.ok ? { error: "upload" } : { error: u.error.key, values: u.error.values };
  const put = await fetch(u.url, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "false" } });
  if (!put.ok) return { error: "upload" };
  const done = await finalizeUpload(u.path);
  if (!done.ok || !done.id || !done.url) return done.ok ? { error: "upload" } : { error: done.error.key, values: done.error.values };
  return { id: done.id, url: done.url, pending: true };
}

function useUploader(onDone: (p: FormPhoto) => void) {
  const t = useTranslations("dashboard");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const r = await uploadOne(file);
        if ("error" in r) setError(t(`errors.${r.error}`, r.values));
        else onDone(r);
      } catch {
        setError(t("errors.upload"));
      } finally {
        setBusy((n) => n - 1);
      }
    }
  };
  return { busy, error, upload };
}

function Thumb({ p, portrait, children }: { p: FormPhoto; portrait?: boolean; children?: React.ReactNode }) {
  const t = useTranslations("dashboard.image");
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line bg-surface-2", portrait ? "aspect-[3/4] w-32" : "aspect-[4/3] w-40")}>
      {/* eslint-disable-next-line @next/next/no-img-element -- signed preview URL */}
      <img src={p.url} alt="" className="h-full w-full object-cover" />
      {p.pending && <span className="absolute left-1.5 top-1.5 rounded-full bg-progress px-2 py-0.5 text-[0.65rem] font-semibold text-white">{t("pending")}</span>}
      <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">{children}</div>
    </div>
  );
}

const iconBtn = "grid h-7 w-7 place-items-center rounded-full bg-brand-deep/70 text-white backdrop-blur hover:bg-brand-deep disabled:opacity-40";

function Picker({ multiple, busy, onFiles, label }: { multiple?: boolean; busy: number; onFiles: (f: FileList | null) => void; label: string }) {
  const t = useTranslations("dashboard.image");
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="sr-only" tabIndex={-1} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy > 0}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-brand-mid/50 px-4 py-2 text-sm font-medium text-brand-mid transition hover:bg-sky disabled:opacity-60"
      >
        <IconImages width={16} height={16} /> {busy > 0 ? t("uploading") : label}
      </button>
    </>
  );
}

/** One photo stored in a photos.id column of the row. */
export function ImageField({ name, initial, portrait }: { name: string; initial: FormPhoto[]; portrait?: boolean }) {
  const t = useTranslations("dashboard.image");
  const [photo, setPhoto] = useState<FormPhoto | null>(initial[0] ?? null);
  const { busy, error, upload } = useUploader(setPhoto);
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={photo?.id ?? ""} />
      <div className="flex flex-wrap items-end gap-3">
        {photo ? (
          <Thumb p={photo} portrait={portrait}>
            <button type="button" className={iconBtn} aria-label={t("remove")} onClick={() => setPhoto(null)}><IconClose width={14} height={14} /></button>
          </Thumb>
        ) : (
          <p className="text-sm text-muted">{t("none")}</p>
        )}
        <Picker busy={busy} onFiles={upload} label={t("upload")} />
      </div>
      <p className="text-xs text-muted">{t("formats")}</p>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/** Ordered gallery linked to the row (photos.<fk>); order = position in the list. */
export function ImagesField({ name, initial }: { name: string; initial: FormPhoto[]; portrait?: boolean }) {
  const t = useTranslations("dashboard.image");
  const [list, setList] = useState<FormPhoto[]>(initial);
  const { busy, error, upload } = useUploader((p) => setList((l) => [...l, p]));
  const move = (i: number, d: number) => setList((l) => {
    const j = i + d;
    if (j < 0 || j >= l.length) return l;
    const c = [...l];
    [c[i], c[j]] = [c[j], c[i]];
    return c;
  });
  return (
    <div className="space-y-2">
      {list.map((p) => <input key={p.id} type="hidden" name={name} value={p.id} />)}
      <div className="flex flex-wrap gap-3">
        {list.map((p, i) => (
          <Thumb key={p.id} p={p}>
            <button type="button" className={iconBtn} aria-label={t("left")} disabled={i === 0} onClick={() => move(i, -1)}><IconChevronLeft width={14} height={14} /></button>
            <button type="button" className={iconBtn} aria-label={t("right")} disabled={i === list.length - 1} onClick={() => move(i, 1)}><IconChevronRight width={14} height={14} /></button>
            <button type="button" className={iconBtn} aria-label={t("remove")} onClick={() => setList((l) => l.filter((x) => x.id !== p.id))}><IconClose width={14} height={14} /></button>
          </Thumb>
        ))}
      </div>
      <Picker multiple busy={busy} onFiles={upload} label={t("add")} />
      <p className="text-xs text-muted">{t("formats")}</p>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
