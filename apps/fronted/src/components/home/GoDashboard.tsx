import { useTranslations } from "next-intl";
import { GoDashboardAction } from "@/actions/navigation";

export default function GoDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <form action={GoDashboardAction}>{children}</form>;
}
