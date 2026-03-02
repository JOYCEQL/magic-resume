import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
    sectionId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Thin interaction wrapper for all section components.
 * Provides hover highlight + click-to-select behavior.
 */
const SectionWrapper: React.FC<SectionWrapperProps> = ({
    sectionId,
    children,
    className = "",
    style,
}) => {
    const { setActiveSection } = useResumeStore();

    return (
        <motion.div
            className={cn(
                "hover:cursor-pointer rounded-md transition-all duration-300 ease-in-out hover:shadow-md",
                "px-3 py-2 -mx-3 -my-2",
                "hover:bg-[#f9f8f3]",
                className
            )}
            style={style}
            onClick={() => setActiveSection(sectionId)}
        >
            {children}
        </motion.div>
    );
};

export default SectionWrapper;
