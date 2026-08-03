
import { useTranslations } from "@/i18n/compat/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ThemedAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

const ThemeModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
}: ThemedAlertDialogProps) => {
  const t = useTranslations("themeModal.delete");

  // 取未插值原文再按 {title} 切分，以便把标题渲染成加粗片段。
  // raw 返回 unknown（见 i18n/compat/utils.ts），断言为 string 并用空串兜底。
  const [descriptionBefore = "", descriptionAfter = ""] = (
    (t.raw("description") as string | undefined) ?? ""
  ).split("{title}");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            <span>
              {descriptionBefore}
              <span className="px-1 font-semibold text-foreground">{title}</span>
              {descriptionAfter}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{t("cancelText")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 border-none"
          >
            {t("confirmText")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ThemeModal;
