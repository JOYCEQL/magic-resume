import React from "react";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";

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
            className={`hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md ${className}`}
            style={style}
            onClick={() => setActiveSection(sectionId)}
        >
            {children}
        </motion.div>
    );
};

export default SectionWrapper;
