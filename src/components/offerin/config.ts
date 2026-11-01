export const OFFERIN_AFFILIATE_URL = "https://app.offerin.cn/r/aff_Wsk_9WRpwPmN";

export const OFFERIN_CONFIG = {
  affiliateUrl: OFFERIN_AFFILIATE_URL,
  partner: "magicv.art",
  campaign: "offerin-aff-page",
};

export type TrackPlacement =
  | "header"
  | "hero"
  | "closing"
  | "mobile-sticky"
  | "sidebar"
  | "landing-nav";

export function trackOfferInEvent(
  name: "aff_page_view" | "aff_outbound_click",
  extra?: { placement?: string }
) {
  if (typeof window === "undefined") return;

  const data = {
    partner: OFFERIN_CONFIG.partner,
    campaign: OFFERIN_CONFIG.campaign,
    ...extra,
  };

  try {
    document.dispatchEvent(
      new CustomEvent("offerin:analytics", { detail: { name, data } })
    );
  } catch {
    // Analytics failures must never block navigation.
  }

  try {
    const win = window as unknown as {
      umami?: { track: (name: string, data: Record<string, unknown>) => void };
      dataLayer?: Array<unknown>;
    };
    win.umami?.track?.(name, data);
  } catch {
    // Analytics failures must never block navigation.
  }
}
