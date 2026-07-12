import type { MediaKind, MediaResult, MediaVariant } from "@/lib/media-downloader/types";

interface ResultCardProps {
  result: MediaResult;
}

const PLATFORM_LABEL: Record<MediaResult["platform"], string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  pinterest: "Pinterest",
  soundcloud: "SoundCloud",
  twitter: "Twitter / X",
  reddit: "Reddit",
  terabox: "TeraBox (Eksperimen)",
};

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

function KindIcon({ kind }: { kind: MediaKind }) {
  if (kind === "audio") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19a3 3 0 11-6 0 3 3 0 016 0zM21 17a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (kind === "image") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  // video
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default function ResultCard({ result }: ResultCardProps) {
  const { platform, title, author, thumbnail, durationSec, variants } = result;

  return (
    <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-sm backdrop-blur-md animate-in fade-in duration-200">
      {/* Media info header */}
      <div className="flex gap-4">
        {thumbnail && (
          <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 border border-neutral-100 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              src={thumbnail}
              alt={title ? title : "Pratinjau media"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
          <span className="inline-flex items-center self-start rounded-full bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
            {PLATFORM_LABEL[platform]}
          </span>

          {title && (
            <h2 className="text-sm md:text-base font-black text-neutral-800 dark:text-zinc-100 leading-snug line-clamp-2">
              {title}
            </h2>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] md:text-xs font-bold text-neutral-400 dark:text-zinc-500">
            {author && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{author}</span>
              </span>
            )}
            {typeof durationSec === "number" && durationSec > 0 && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(durationSec)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Download variants */}
      <div className="mt-5 space-y-2.5">
        <span className="block text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
          Pilih & Unduh
        </span>

        {variants.map((variant: MediaVariant, idx: number) => {
          const size = variant.sizeBytes ? formatSize(variant.sizeBytes) : "";
          return (
            <a
              key={`${variant.url}-${idx}`}
              href={variant.url}
              download
              target="_blank"
              rel="noopener nofollow"
              className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-neutral-900 dark:bg-orange-600 hover:bg-neutral-800 dark:hover:bg-orange-700 text-white transition duration-200 cursor-pointer shadow-md shadow-neutral-900/10 dark:shadow-orange-650/10"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
                <KindIcon kind={variant.kind} />
              </span>
              <span className="min-w-0 flex-1 flex flex-col text-left">
                <span className="text-xs md:text-sm font-black leading-tight truncate">
                  {variant.label}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {variant.ext}{size ? ` · ${size}` : ""}
                </span>
              </span>
              <svg className="w-5 h-5 flex-shrink-0 opacity-80 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
            </a>
          );
        })}

        {variants.length === 0 && (
          <p className="text-xs font-medium text-neutral-400 dark:text-zinc-500 text-center py-4">
            Tidak ada media yang dapat diunduh dari link ini.
          </p>
        )}
      </div>
    </div>
  );
}
