import { useRef, useEffect } from "react";
import type { ForwardedRef } from "react";

export function useForwardedRef<T>(ref: ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}
