import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAIConfigStore } from "@/store/useAIConfigStore";

export const useAIConfiguration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("translation", { keyPrefix: "previewDock.grammarCheck" });
  const { isConfigured, selectedModel } = useAIConfigStore();

  const checkConfiguration = () => {
    if (!isConfigured()) {
      toast.error(
        <>
          <span>{t("configurePrompt")}</span>
          <Button
            variant="link"
            className="p-0 h-auto ml-1 font-bold underline decoration-[#D97757]/30 underline-offset-4 text-[#D97757]"
            onClick={() => navigate({ to: "/app/dashboard/ai" })}
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
