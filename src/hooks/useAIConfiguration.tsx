import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
            className="p-0 h-auto ml-1 font-normal"
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
