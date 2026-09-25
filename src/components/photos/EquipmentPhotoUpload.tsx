"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Upload, X } from "lucide-react";
import { PHOTO_AREAS } from "@/lib/photo-labels";

type Mode = "before" | "after";

type Item = { id: string; file: File; url: string };

const COPY: Record<
  Mode,
  {
    eyebrow: string;
    title: string;
    description: string;
    helper: string;
    requiredLabel: string;
    accent: string;
  }
> = {
  before: {
    eyebrow: "Initial condition",
    title: "Before photos",
    description: "Photograph the machine before it leaves.",
    helper: "At least one photo is required.",
    requiredLabel: "1 photo required to complete delivery",
    accent: "border-stone-200 bg-stone-50",
  },
  after: {
    eyebrow: "Return condition",
    title: "After photos",
    description: "Photograph the machine after it returns.",
    helper: "At least one photo is required.",
    requiredLabel: "1 photo required to complete pickup",
    accent: "border-stone-200 bg-stone-50",
  },
};

export function EquipmentPhotoUpload({
  name = "photos",
  mode,
  heading,
  purpose,
  required = true,
  onCountChange,
}: {
  name?: string;
  mode: Mode;
  heading?: string;
  purpose?: string;
  required?: boolean;
  onCountChange?: (count: number) => void;
}) {
  const copy = COPY[mode];
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const syncedRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onCountChange?.(items.length);
    const input = syncedRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    items.forEach((item) => transfer.items.add(item.file));
    input.files = transfer.files;
  }, [items, onCountChange]);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // Revoke leftover object URLs only when the uploader unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/") && file.size > 0);
    if (images.length === 0) return;
    setItems((current) => [
      ...current,
      ...images.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      current.filter((item) => item.id === id).forEach((item) => URL.revokeObjectURL(item.url));
      return next;
    });
  }

  return (
    <section className={`rounded border p-4 ${copy.accent}`}>
      <p className="text-sm font-semibold text-stone-900">{heading || copy.title}</p>
      <p className="mt-1 text-sm text-stone-600">{purpose || copy.description}</p>

      <input
        ref={syncedRef}
        className="sr-only"
        type="file"
        name={name}
        accept="image/*"
        multiple
        required={required}
        tabIndex={-1}
        onChange={() => undefined}
      />
      <input
        ref={cameraRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />

      <div
        className={`mt-4 rounded border-2 border-dashed bg-white px-4 py-6 text-center ${
          dragging ? "border-orange-500 bg-orange-50" : "border-stone-300"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files || []));
        }}
      >
        <Camera className="mx-auto h-8 w-8 text-stone-400" />
        <p className="mt-3 text-sm font-medium text-stone-700">
          {dragging ? "Drop photos here" : "Take a photo or upload from this device"}
        </p>
        <p className="mt-1 text-xs text-stone-500">Front, back, sides, attachments, and any damage.</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="btn btn-primary" type="button" onClick={() => cameraRef.current?.click()}>
            <Camera className="h-4 w-4" />
            Take photo
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => galleryRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Upload photos
          </button>
        </div>
      </div>

      <p className={`mt-4 text-sm font-semibold ${items.length > 0 ? "text-emerald-800" : "text-orange-800"}`}>
        {items.length > 0
          ? `✓ ${items.length} photo${items.length === 1 ? "" : "s"} added`
          : required
            ? copy.requiredLabel
            : "Photos optional"}
      </p>

      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <figure key={item.id} className="relative overflow-hidden rounded-xl border border-stone-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.file.name} className="h-32 w-full object-cover" />
              <figcaption className="truncate px-2 py-1 text-[11px] text-stone-500">{item.file.name}</figcaption>
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-stone-900/80 p-1 text-white"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => removeItem(item.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-white px-3 py-6 text-sm text-stone-500">
          <ImagePlus className="h-4 w-4" />
          No photos selected yet
        </p>
      )}

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-500">Photograph these areas when possible</p>
      <ul className="mt-1 grid grid-cols-2 gap-x-3 text-sm text-stone-600 sm:grid-cols-3">
        {PHOTO_AREAS.map((area) => (
          <li key={area}>• {area}</li>
        ))}
      </ul>
    </section>
  );
}
