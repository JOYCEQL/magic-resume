export interface UpstreamErrorDetails {
  status: number;
  code?: string;
  type?: string;
  message?: string;
  requestId?: string;
}

/** Render as text only; never interpret a provider message as HTML. */
export function upstreamErrorMessage(error: UpstreamErrorDetails): string {
  const details = [`HTTP ${error.status}`];
  if (error.code) details.push(error.code);
  if (error.message) details.push(error.message);
  if (error.requestId) details.push(`Request ID: ${error.requestId}`);
  return details.join(" · ");
}
