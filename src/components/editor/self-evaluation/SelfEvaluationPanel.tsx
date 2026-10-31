import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import Field from "../Field";

const SelfEvaluationPanel = () => {
    const selfEvaluationContent = useResumeStore(
        (state) => state.activeResume?.selfEvaluationContent ?? ""
    );
    const updateSelfEvaluationContent = useResumeStore(
        (state) => state.updateSelfEvaluationContent
    );
    const handleChange = (value: string) => {
        updateSelfEvaluationContent(value);
    };

    return (
        <div
            className={cn(
                "rounded-lg border p-4",
                "bg-card",
                "border-border"
            )}
        >
            <Field
                value={selfEvaluationContent}
                onChange={handleChange}
                type="editor"
                placeholder="描述你的自我评价..."
            />
        </div>
    );
};

export default SelfEvaluationPanel;
