import { cn } from "@/lib/utils";

export function LogoMark({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Chirp"
      className={cn("rtl:-scale-x-100", className)}
    >
      <path d="M26 13c-1-6 3-10 9-10-2 3-2 7 1 10z" fill="var(--canary)" />
      <circle cx="30" cy="35" r="22" fill="var(--canary)" />
      <path d="M13 50L4 61l21-6z" fill="var(--canary)" />
      <path d="M51 30l11 5-11 6z" fill="var(--amber)" />
      <circle cx="39" cy="29" r="3.2" fill="var(--ink)" />
      <path
        d="M18 38c4 8 14 10 21 4"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 30,
  className,
  wordmarkClassName,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden="true" className="inline-flex">
        <LogoMark size={size} />
      </span>
      <span
        dir="ltr"
        className={cn(
          "text-2xl font-semibold tracking-[-0.03em]",
          wordmarkClassName,
        )}
      >
        chirp
      </span>
    </span>
  );
}
