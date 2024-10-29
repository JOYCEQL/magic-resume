import { GripVertical } from "lucide-react";
import { ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CustomHandleProps {
  withHandle?: boolean;
  className?: string;
}

const CustomHandle = ({ withHandle = true, className }: CustomHandleProps) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <ResizableHandle
      className={cn(
        "relative w-1.5 transition-all duration-150",
        isActive ? "bg-indigo-500" : className,
        "hover:bg-indigo-500 hover:w-1.5"
      )}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
    >
      {withHandle && (
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-6 h-8 rounded-sm flex items-center justify-center",
            isActive ? "bg-indigo-500" : "bg-transparent",
            "hover:bg-indigo-500 group"
          )}
        >
          <GripVertical
            className={cn(
              "w-4 h-4",
              isActive ? "text-white" : "text-gray-400",
              "group-hover:text-white"
            )}
          />
        </div>
      )}
    </ResizableHandle>
  );
};

export default CustomHandle;
