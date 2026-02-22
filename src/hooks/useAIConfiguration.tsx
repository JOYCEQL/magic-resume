import { useRouter } from "@/lib/navigation";
import { useTranslations } from "@/i18n/compat/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAIConfigStore } from "@/store/useAIConfigStore";

export const useAIConfiguration = () => {
  const router = useRouter();
  const t = useTranslations("previewDock.grammarCheck");
  const { isConfigured, selectedModel } = useAIConfigStore();

  const checkConfiguration = () => {
    if (!isConfigured()) {
      toast.error(
        <>
          <span>{t("configurePrompt")}</span>
          <Button
            variant="link"
            className="p-0 h-auto ml-1 font-bold underline decoration-[#D97757]/30 underline-offset-4 text-[#D97757]"
            onClick={() => router.push("/app/dashboard/ai")}
          >
            {t("configureButton")}
          </Button>
        </>
      );
      return false;
    }

    return true;
  };

  return {
    checkConfiguration,
  };
};
