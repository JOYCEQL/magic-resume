import React from "react";
import { motion } from "framer-motion";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfIcon } from "@/components/shared/icons/PdfIcon";
import { cn } from "@/lib/utils";

interface AnimatedImportButtonProps {
    onClick: () => void;
    t: any;
}

export const AnimatedImportButton = ({ onClick, t }: AnimatedImportButtonProps) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <Button
                onClick={onClick}
                variant="outline"
                className={cn(
                    "relative h-10 overflow-hidden px-4 font-medium transition-all duration-300",
                    "border-border/60 bg-background hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm",
                    "dark:border-border/40 dark:hover:border-primary/40"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="relative h-5 w-5 overflow-hidden">
                        <motion.div
                            animate={{
                                y: isHovered ? -20 : 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                            className="flex flex-col"
                        >
                            <div className="flex h-5 w-5 items-center justify-center">
                                <Braces className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex h-5 w-5 items-center justify-center">
                                <PdfIcon className="h-4 w-4 text-red-500" />
                            </div>
                        </motion.div>
                    </div>
                    <span className="relative z-10">{t("dashboard.resumes.import")}</span>
                </div>
            </Button>
        </motion.div>
    );
};
