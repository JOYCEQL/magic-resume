import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { Certificate } from "@/types/resume";
import ThemeModal from "@/components/shared/ThemeModal";
import { useTranslations } from "@/i18n/compat/client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const CertificateItem = ({ certificate }: { certificate: Certificate }) => {
    const { updateCertificate, removeCertificate, setDraggingProjectId } = useResumeStore();
    const dragControls = useDragControls();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const t = useTranslations("workbench.certificatesPanel");

    return (
        <Reorder.Item
            id={certificate.id}
            value={certificate}
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={() => setDraggingProjectId(null)}
            className={cn(
                "rounded-lg border overflow-hidden flex flex-col group",
                "bg-card hover:border-primary/50 border-border"
            )}
        >
            <div className="flex h-24">
                {/* Drag handler */}
                <div
                    onPointerDown={(e) => {
                        dragControls.start(e);
                        setDraggingProjectId(certificate.id);
                    }}
                    onPointerUp={() => setDraggingProjectId(null)}
                    onPointerCancel={() => setDraggingProjectId(null)}
                    className={cn(
                        "w-8 flex items-center justify-center border-r shrink-0 touch-none",
                        "border-border cursor-grab hover:bg-muted/50"
                    )}
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground transition-transform group-hover:scale-110" />
                </div>

                {/* Thumbnail Preview */}
                <div className="w-24 border-r border-border shrink-0 bg-muted/20 p-2 flex items-center justify-center overflow-hidden">
                    <img src={certificate.url} alt="cert" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                </div>

                {/* Content & Actions */}
                <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t("width")}: {certificate.width}%</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 -mr-2"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <Slider
                        value={[certificate.width]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={([val]) => updateCertificate(certificate.id, { width: val })}
                    />
                </div>
            </div>
            <ThemeModal
                isOpen={deleteDialogOpen}
                title={t("delete")}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={() => {
                    removeCertificate(certificate.id);
                    setDeleteDialogOpen(false);
                }}
            />
        </Reorder.Item>
    );
};

export default CertificateItem;
