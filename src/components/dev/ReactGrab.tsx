import { useEffect } from "react";

export function ReactGrab() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import("react-grab");
    }
  }, []);

  return null;
}
