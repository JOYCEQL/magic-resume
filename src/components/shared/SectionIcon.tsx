import { BookOpen } from "lucide-react";

/** Keep stored section icons serializable, while supporting a publication icon. */
export default function SectionIcon({ icon }: { icon?: string }) {
  return icon === "publications"
    ? <BookOpen className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" />
    : <>{icon}</>;
}
