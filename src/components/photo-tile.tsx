import Image from "next/image";
import { CameraIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const toneClasses = {
  ocean:
    "from-primary/95 via-primary/70 to-sky-200/70 text-white after:bg-white/10",
  ember:
    "from-orange-500/90 via-accent/75 to-amber-100/80 text-slate-950 after:bg-white/25",
  meadow:
    "from-emerald-600/90 via-emerald-400/75 to-lime-100/80 text-white after:bg-white/12",
  dusk:
    "from-slate-800/95 via-slate-700/85 to-slate-300/70 text-white after:bg-white/8",
} as const;

type PhotoTileProps = {
  title: string;
  subtitle: string;
  tone: keyof typeof toneClasses;
  imageUrl: string;
  badgeLabel?: string;
};

export function PhotoTile({
  title,
  subtitle,
  tone,
  imageUrl,
  badgeLabel = "Foto unggulan",
}: PhotoTileProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-2xl bg-linear-to-br p-4 shadow-inner after:absolute after:inset-3 after:rounded-xl after:border after:border-white/20 after:content-['']",
        toneClasses[tone]
      )}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-black/10" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-xs font-medium backdrop-blur-sm">
            <CameraIcon className="size-3.5" />
            {badgeLabel}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-85">
            RCI
          </span>
        </div>
        <div className="max-w-[16rem] rounded-2xl bg-black/30 px-3 py-3 backdrop-blur-xs">
          <div className="text-sm font-semibold leading-snug">{title}</div>
          <div className="mt-1 text-xs leading-6 opacity-85">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
