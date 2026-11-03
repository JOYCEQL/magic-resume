import { cn } from "@/lib/utils";

// Drawn on the A4 grid (210 x 297) so it scales with any preview size.
// Resume paper is white in both themes, so the bars use a fixed ink tint.
const LINES: Array<[x: number, y: number, width: number]> = [
  [16, 80, 170], [16, 88, 158], [16, 96, 166], [16, 104, 120],
  [16, 138, 60], [150, 138, 44], [16, 147, 172], [16, 155, 164], [16, 163, 150], [16, 171, 110],
  [16, 205, 72], [150, 205, 44], [16, 214, 168], [16, 222, 160], [16, 230, 132],
  [16, 264, 176], [16, 272, 150],
];

export function ResumePaperSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("skeleton-shimmer", className)}>
      <svg viewBox="0 0 210 297" preserveAspectRatio="xMidYMin meet" className="h-full w-full text-slate-900/[0.07]">
        <g fill="currentColor">
          <rect x="16" y="18" width="24" height="31" rx="3" />
          <rect x="48" y="22" width="46" height="8" rx="2" />
          <rect x="48" y="35" width="30" height="5" rx="1.5" />
          <rect x="118" y="21" width="34" height="4" rx="1.5" />
          <rect x="118" y="29" width="42" height="4" rx="1.5" />
          <rect x="118" y="37" width="30" height="4" rx="1.5" />
          <rect x="164" y="21" width="28" height="4" rx="1.5" />
          <rect x="164" y="29" width="24" height="4" rx="1.5" />
          {[66, 124, 191, 250].map((y) => (
            <g key={y}>
              <rect x="16" y={y} width="30" height="6" rx="1.5" />
              <rect x="16" y={y + 9} width="178" height="0.8" />
            </g>
          ))}
          {LINES.map(([x, y, width]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={width} height="3.6" rx="1.5" />
          ))}
        </g>
      </svg>
    </div>
  );
}
