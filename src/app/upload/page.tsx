"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DownloadIcon } from "@/components/icons";

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/upload");
  }, [loading, user, router]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-title", encodeURIComponent(title || file.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setBusy(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        router.push(`/?v=${encodeURIComponent(data.upload.src)}`);
      } else {
        try {
          setError(JSON.parse(xhr.responseText).error || "Upload failed.");
        } catch {
          setError("Upload failed.");
        }
      }
    };
    xhr.onerror = () => {
      setBusy(false);
      setError("Network error during upload.");
    };
    xhr.send(file);
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Upload a video</h1>
      <p className="mt-2 text-sm text-white/50">
        Share your own clip on StreamPlus. MP4 or WebM, up to 200MB.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-500 placeholder:text-white/40"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-8 text-sm text-white/60 hover:bg-white/5 transition-colors"
        >
          <DownloadIcon width={18} height={18} className="rotate-180" />
          {file ? file.name : "Choose a video file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={pick}
          className="hidden"
        />

        {busy && (
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={upload}
          disabled={!file || busy}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.99] transition py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? `Uploading… ${progress}%` : "Upload"}
        </button>
      </div>
    </div>
  );
}
