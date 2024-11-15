import { cn } from "@/lib/utils";
import { BasicInfo, GlobalSettings } from "@/types/resume";
import { motion } from "framer-motion";
import React from "react";

interface BaaseInfoProps {
  basic: BasicInfo;
  globalSettings: GlobalSettings | undefined;
}

export function BaseInfo({ basic, globalSettings }: BaaseInfoProps) {
  return (
    <div className="text-center space-y-4">
      <motion.h1
        layout="position"
        className={cn("font-bold", "text-gray-900")}
        style={{
          fontSize: `${(globalSettings?.headerSize || 24) * 1.5}px`
        }}
      >
        {basic.name}
      </motion.h1>
      <motion.h2
        layout="position"
        className="text-gray-600"
        style={{
          fontSize: `${globalSettings?.subheaderSize || 16}px`
        }}
      >
        {basic.title}
      </motion.h2>
      <motion.div
        layout="position"
        className="flex justify-center items-center space-x-4 flex-wrap"
        style={{
          fontSize: `${globalSettings?.baseFontSize || 14}px`,
          color: "rgb(75, 85, 99)"
        }}
      >
        {[
          basic.email,
          basic.phone,
          basic.location,
          basic.birthDate ? new Date(basic.birthDate).toLocaleDateString() : "",
          ...(basic.customFields?.map((field) => field.value) || [])
        ]
          .filter(Boolean)
          .map((item, index, array) => (
            <React.Fragment key={index}>
              <span>{item}</span>
              {index < array.length - 1 && <span>•</span>}
            </React.Fragment>
          ))}
      </motion.div>
    </div>
  );
}
