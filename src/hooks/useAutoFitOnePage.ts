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
  minHeaderSize: 16,
  minSubheaderSize: 16,
  headerRatio: 1.25,
  subheaderRatio: 1.0,
  minHeaderDiff: 2,
  minSubheaderDiff: 2
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
    return resumeContent.scrollHeight;
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

  const adjustFontSizesCoordinated = useCallback(
    (
      currentParams: OptimizationParams,
      scaleFactor: number
    ): OptimizationParams => {
      const newBaseFontSize = Math.max(
        FONT_CONSTRAINTS.minBaseFontSize,
        Math.round(currentParams.baseFontSize * scaleFactor)
      );

      const { headerSize, subheaderSize } =
        calculateCoordinatedFontSizes(newBaseFontSize);

      return {
        ...currentParams,
        baseFontSize: newBaseFontSize,
        headerSize,
        subheaderSize
      };
    },
    [calculateCoordinatedFontSizes]
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
        pagePadding: params.pagePadding
      });
    },
    [updateGlobalSettings]
  );

  const waitForDOMUpdate = (): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 100);
      });
    });
  };

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
      pagePadding: globalSettings.pagePadding || 32
    };

    let currentParams = { ...initialParams };
    let iterations = 0;
    const maxIterations = 20;
    const tolerance = 10;

    const targetHeight = calculateTargetHeight(currentParams.pagePadding);
    const initialHeight = getCurrentContentHeight();

    console.log("开始自动一页纸优化", {
      targetHeight,
      initialHeight,
      initialParams,
      needsReduction: initialHeight > targetHeight
    });
    if (initialHeight <= targetHeight + tolerance) {
      return {
        success: true,
        finalParams: currentParams,
        iterations: 0,
        finalHeight: initialHeight,
        targetHeight,
        initialHeight,
        reductionPercentage: 0
      };
    }

    while (iterations < maxIterations) {
      iterations++;

      applyOptimizationParams(currentParams);
      await waitForDOMUpdate();
      const currentHeight = getCurrentContentHeight();

      console.log(`第${iterations}次迭代`, {
        currentHeight,
        targetHeight,
        difference: currentHeight - targetHeight,
        params: currentParams
      });

      if (currentHeight <= targetHeight + tolerance) {
        const reductionPercentage =
          ((initialHeight - currentHeight) / initialHeight) * 100;
        return {
          success: true,
          finalParams: currentParams,
          iterations,
          finalHeight: currentHeight,
          targetHeight,
          initialHeight,
          reductionPercentage
        };
      }

      const heightRatio = targetHeight / currentHeight;
      const reductionNeeded = (currentHeight - targetHeight) / currentHeight;
      const isEarlyIteration = iterations <= 5;
      const isLateIteration = iterations > 15;
      let fontScaleFactor = 1.0;
      let spacingScaleFactor = 1.0;
      let lineHeightScaleFactor = 1.0;

      if (reductionNeeded > 0.4) {
        fontScaleFactor = 0.85;
        spacingScaleFactor = 0.7;
        lineHeightScaleFactor = 0.92;
      } else if (reductionNeeded > 0.25) {
        fontScaleFactor = 0.9;
        spacingScaleFactor = 0.8;
        lineHeightScaleFactor = 0.95;
      } else if (reductionNeeded > 0.15) {
        fontScaleFactor = 0.95;
        spacingScaleFactor = 0.9;
        lineHeightScaleFactor = 0.97;
      } else if (reductionNeeded > 0.05) {
        fontScaleFactor = 0.98;
        spacingScaleFactor = 0.95;
        lineHeightScaleFactor = 0.99;
      } else {
        fontScaleFactor = 0.99;
        spacingScaleFactor = 0.98;
        lineHeightScaleFactor = 0.995;
      }

      currentParams = adjustFontSizesCoordinated(
        currentParams,
        fontScaleFactor
      );
      currentParams.lineHeight = Math.max(
        1.3,
        currentParams.lineHeight * lineHeightScaleFactor
      );
      currentParams.paragraphSpacing = Math.max(
        2,
        Math.round(currentParams.paragraphSpacing * spacingScaleFactor)
      );
      currentParams.sectionSpacing = Math.max(
        6,
        Math.round(currentParams.sectionSpacing * spacingScaleFactor)
      );

      if (isLateIteration && currentParams.pagePadding > 20) {
        currentParams.pagePadding = Math.max(
          16,
          currentParams.pagePadding * 0.9
        );
      }

      if (
        currentParams.baseFontSize <= FONT_CONSTRAINTS.minBaseFontSize &&
        currentParams.pagePadding > 16
      ) {
        currentParams.pagePadding = Math.max(
          16,
          currentParams.pagePadding * 0.9
        );
        const newTargetHeight = calculateTargetHeight(
          currentParams.pagePadding
        );
        if (currentHeight <= newTargetHeight + tolerance) {
          const reductionPercentage =
            ((initialHeight - currentHeight) / initialHeight) * 100;
          return {
            success: true,
            finalParams: currentParams,
            iterations,
            finalHeight: currentHeight,
            targetHeight: newTargetHeight,
            initialHeight,
            reductionPercentage
          };
        }
      }
    }

    const finalHeight = getCurrentContentHeight();
    const reductionPercentage =
      ((initialHeight - finalHeight) / initialHeight) * 100;
    return {
      success: finalHeight <= targetHeight + tolerance,
      finalParams: currentParams,
      iterations,
      finalHeight,
      targetHeight,
      initialHeight,
      reductionPercentage
    };
  }, [
    activeResume,
    adjustFontSizesCoordinated,
    applyOptimizationParams,
    calculateCoordinatedFontSizes
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
      pagePadding: 32
    };

    updateGlobalSettings(defaultParams);
  }, [activeResume, calculateCoordinatedFontSizes, updateGlobalSettings]);

  return {
    autoFitOnePage,
    resetToDefaults,
    getCurrentContentHeight,
    calculateTargetHeight
  };
};
