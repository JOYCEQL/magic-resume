import { useCallback } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { GlobalSettings } from "@/types/resume";

interface OptimizationParams {
  baseFontSize: number;
  headerSize: number;
  subheaderSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  sectionSpacing: number;
  pagePadding: number;
}

const FONT_CONSTRAINTS = {
  minBaseFontSize: 14,
  minHeaderSize: 14,
  minSubheaderSize: 14,
  headerRatio: 1.25,
  subheaderRatio: 1.0,
  minHeaderDiff: 2,
  minSubheaderDiff: 2,
};

interface OptimizationResult {
  success: boolean;
  finalParams: OptimizationParams;
  iterations: number;
  finalHeight: number;
  targetHeight: number;
  initialHeight: number;
  reductionPercentage: number;
}

export const useAutoFitOnePage = () => {
  const { activeResume, updateGlobalSettings } = useResumeStore();

  const A4_HEIGHT_MM = 297;
  const MM_TO_PX = 3.78;

  const calculateTargetHeight = (pagePadding: number): number => {
    const pagePaddingMM = pagePadding / MM_TO_PX;
    const contentHeightMM = A4_HEIGHT_MM - pagePaddingMM * 2;
    return contentHeightMM * MM_TO_PX;
  };

  const getCurrentContentHeight = (): number => {
    const resumeContent = document.getElementById("resume-preview");
    if (!resumeContent) return 0;
    const rect = resumeContent.getBoundingClientRect();
    return Math.max(0, rect.height);
  };

  const calculateCoordinatedFontSizes = useCallback(
    (baseFontSize: number): { headerSize: number; subheaderSize: number } => {
      let headerSize = Math.round(baseFontSize * FONT_CONSTRAINTS.headerRatio);
      let subheaderSize = Math.round(
        baseFontSize * FONT_CONSTRAINTS.subheaderRatio
      );

      headerSize = Math.max(headerSize, FONT_CONSTRAINTS.minHeaderSize);
      subheaderSize = Math.max(
        subheaderSize,
        FONT_CONSTRAINTS.minSubheaderSize
      );

      headerSize = Math.max(
        headerSize,
        baseFontSize + FONT_CONSTRAINTS.minHeaderDiff
      );
      subheaderSize = Math.max(
        subheaderSize,
        baseFontSize + FONT_CONSTRAINTS.minSubheaderDiff
      );

      return { headerSize, subheaderSize };
    },
    []
  );

  const applyOptimizationParams = useCallback(
    (params: OptimizationParams): void => {
      updateGlobalSettings({
        baseFontSize: params.baseFontSize,
        headerSize: params.headerSize,
        subheaderSize: params.subheaderSize,
        lineHeight: params.lineHeight,
        paragraphSpacing: params.paragraphSpacing,
        sectionSpacing: params.sectionSpacing,
        pagePadding: params.pagePadding,
      });
    },
    [updateGlobalSettings]
  );

  const waitForDOMUpdate = (): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });
  };

  const calculateParamsFromScale = useCallback(
    (scale: number, initialParams: OptimizationParams): OptimizationParams => {
      const lerp = (start: number, end: number, t: number) => {
        return start + (end - start) * t;
      };

      const minBase = FONT_CONSTRAINTS.minBaseFontSize;
      const currentBase = initialParams.baseFontSize;
      const targetBase = Math.max(minBase, currentBase);

      const newBaseFontSize = Math.round(lerp(minBase, targetBase, scale));
      const { headerSize, subheaderSize } =
        calculateCoordinatedFontSizes(newBaseFontSize);

      const minLineHeight = 1.2;
      const newLineHeight = Number(
        lerp(minLineHeight, initialParams.lineHeight, scale).toFixed(2)
      );

      const minParaSpacing = 4;
      const minSectionSpacing = 12;

      const newParaSpacing = Math.round(
        lerp(minParaSpacing, initialParams.paragraphSpacing, scale)
      );
      const newSectionSpacing = Math.round(
        lerp(minSectionSpacing, initialParams.sectionSpacing, scale)
      );

      const minPadding = 20;
      const newPadding = Math.round(
        lerp(minPadding, initialParams.pagePadding, scale)
      );

      return {
        baseFontSize: newBaseFontSize,
        headerSize,
        subheaderSize,
        lineHeight: newLineHeight,
        paragraphSpacing: newParaSpacing,
        sectionSpacing: newSectionSpacing,
        pagePadding: newPadding,
      };
    },
    [calculateCoordinatedFontSizes]
  );

  const autoFitOnePage = useCallback(async (): Promise<OptimizationResult> => {
    if (!activeResume) {
      throw new Error("没有活跃的简历");
    }

    const { globalSettings = {} } = activeResume;
    const baseFontSize = globalSettings.baseFontSize || 16;
    const { headerSize, subheaderSize } =
      calculateCoordinatedFontSizes(baseFontSize);

    const initialParams: OptimizationParams = {
      baseFontSize,
      headerSize: globalSettings.headerSize || headerSize,
      subheaderSize: globalSettings.subheaderSize || subheaderSize,
      lineHeight: globalSettings.lineHeight || 1.5,
      paragraphSpacing: globalSettings.paragraphSpacing || 12,
      sectionSpacing: globalSettings.sectionSpacing || 24,
      pagePadding: globalSettings.pagePadding || 32,
    };

    const initialHeight = getCurrentContentHeight();
    const initialTargetHeight = calculateTargetHeight(
      initialParams.pagePadding
    );

    console.log("开始自动一页纸优化 (Binary Search)", {
      initialHeight,
      targetHeight: initialTargetHeight,
    });

    if (initialHeight <= initialTargetHeight) {
      return {
        success: true,
        finalParams: initialParams,
        iterations: 0,
        finalHeight: initialHeight,
        targetHeight: initialTargetHeight,
        initialHeight,
        reductionPercentage: 0,
      };
    }

    let low = 0.0;
    let high = 1.0;
    let bestParams = initialParams;
    let bestHeight = initialHeight;
    let bestScale = 1.0;
    let success = false;

    const iterations = 8;

    for (let i = 0; i < iterations; i++) {
      const mid = (low + high) / 2;
      const params = calculateParamsFromScale(mid, initialParams);

      applyOptimizationParams(params);
      await waitForDOMUpdate();

      const currentHeight = getCurrentContentHeight();
      const currentTargetHeight = calculateTargetHeight(params.pagePadding);

      console.log(
        `Iteration ${i + 1}: scale=${mid.toFixed(
          3
        )}, height=${currentHeight}, target=${currentTargetHeight}`
      );

      if (currentHeight <= currentTargetHeight) {
        success = true;
        bestParams = params;
        bestHeight = currentHeight;
        bestScale = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    if (success) {
      applyOptimizationParams(bestParams);
      await waitForDOMUpdate();
    } else {
      const minParams = calculateParamsFromScale(0, initialParams);
      applyOptimizationParams(minParams);
      await waitForDOMUpdate();
      bestParams = minParams;
      bestHeight = getCurrentContentHeight();
    }

    const finalTargetHeight = calculateTargetHeight(bestParams.pagePadding);
    const reductionPercentage =
      ((initialHeight - bestHeight) / initialHeight) * 100;

    return {
      success,
      finalParams: bestParams,
      iterations,
      finalHeight: bestHeight,
      targetHeight: finalTargetHeight,
      initialHeight,
      reductionPercentage,
    };
  }, [
    activeResume,
    applyOptimizationParams,
    calculateCoordinatedFontSizes,
    calculateParamsFromScale,
  ]);

  const resetToDefaults = useCallback(() => {
    if (!activeResume) return;

    const defaultBaseFontSize = 16;
    const { headerSize, subheaderSize } =
      calculateCoordinatedFontSizes(defaultBaseFontSize);

    const defaultParams: Partial<GlobalSettings> = {
      baseFontSize: defaultBaseFontSize,
      headerSize,
      subheaderSize,
      lineHeight: 1.5,
      paragraphSpacing: 12,
      sectionSpacing: 24,
      pagePadding: 32,
    };

    updateGlobalSettings(defaultParams);
  }, [activeResume, calculateCoordinatedFontSizes, updateGlobalSettings]);

  return {
    autoFitOnePage,
    resetToDefaults,
    getCurrentContentHeight,
    calculateTargetHeight,
  };
};
