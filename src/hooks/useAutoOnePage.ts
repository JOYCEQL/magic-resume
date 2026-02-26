import { useMemo } from "react";

const MM_TO_PX = 3.78;
const A4_HEIGHT_PX = 297 * MM_TO_PX;
// 最多只允许缩小到 90%，保证文字可读性和美观
const MIN_SCALE = 0.9;

interface UseAutoOnePageOptions {
  contentHeight: number;
  pagePadding: number;
  enabled: boolean;
}

interface UseAutoOnePageResult {
  scaleFactor: number;
  isScaled: boolean;
  /** 内容过多，即使缩放到下限也无法完美一页 */
  cannotFit: boolean;
}

export function useAutoOnePage({
  contentHeight,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): UseAutoOnePageResult {
  return useMemo(() => {
    if (!enabled || contentHeight <= 0) {
      return { scaleFactor: 1, isScaled: false, cannotFit: false };
    }

    // A4 可用内容高度 = A4 总高度 - 上下页边距
    const availableHeight = A4_HEIGHT_PX - 2 * pagePadding;

    // 实际内容高度（去掉 #resume-preview 的上下 padding）
    const actualContentHeight = contentHeight - 2 * pagePadding;

    if (actualContentHeight <= availableHeight) {
      // 内容未超出一页，不需要缩放
      return { scaleFactor: 1, isScaled: false, cannotFit: false };
    }

    const idealScale = availableHeight / actualContentHeight;

    if (idealScale >= MIN_SCALE) {
      // 在合理范围内，直接缩放
      return { scaleFactor: idealScale, isScaled: true, cannotFit: false };
    }

    // 超出合理缩放范围，仍按下限缩放，但标记 cannotFit
    return { scaleFactor: MIN_SCALE, isScaled: true, cannotFit: true };
  }, [contentHeight, pagePadding, enabled]);
}
