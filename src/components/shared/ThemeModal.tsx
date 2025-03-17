"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations("themeModal.delete");

  const modalContent = {
    delete: {
      title: t("title"),
      description: (
        <>
          <span>
            {t.raw("description").split("{title}")[0]}
            <span className="px-2 font-semibold text-primary">{title}</span>
          </span>
          {t.raw("description").split("{title}")[1]}
        </>
      ),
      confirmText: t("confirmText"),
      illustration: (
        <svg
          className="h-32 w-32"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="70" fill="hsl(262.1, 83.3%, 57.8%)" />
          <rect
            x="70"
            y="85"
            width="60"
            height="40"
            rx="5"
            stroke="white"
            strokeWidth="4"
          />
          <path
            d="M85 85V75C85 70 90 65 95 65H105C110 65 115 70 115 75V85"
            stroke="white"
            strokeWidth="4"
          />
          <path
            d="M80 95L120 115M120 95L80 115"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  };

  const content = modalContent["delete"];

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-md rounded-[32px] border-none dark:bg-neutral-900 bg-white p-0 shadow-xl"
      >
        <div className="relative overflow-hidden p-6">
          <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-primary/20" />
          <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary/20" />
          <div className="absolute left-4 top-4 h-2 w-2 rounded-sm bg-primary" />
          <div className="absolute bottom-4 right-4 h-2 w-2 rounded-sm bg-primary" />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              {content.illustration}
            </motion.div>

            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl font-bold text-gray-900 dark:text-neutral-200">
                {content.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-500 dark:text-neutral-400">
                {content.description}
                {/* 渲染成组件 */}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-8 flex w-full gap-4 sm:flex-row">
              <AlertDialogCancel className="flex-1 rounded-full dark:bg-gray-800 dark:text-neutral-200  text-base font-semibold text-gray-800 ">
                {t("cancelText")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative flex-1 overflow-hidden rounded-full bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary"
              >
                <span className="relative z-10">{content.confirmText}</span>
                <motion.div
                  className="absolute inset-0 bg-red-600"
                  initial={false}
                  animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                />
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ThemeModal;
