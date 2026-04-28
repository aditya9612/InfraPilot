import { API_BASE_URL } from "../services/api";

/**
 * Formats an image URL. If the URL is relative (starts with /),
 * it prepends the API_BASE_URL.
 */
export const getFullImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  
  // Clean up API_BASE_URL if it ends with /api/v1 or similar
  // The goal is to get the root host
  const baseUrl = API_BASE_URL?.replace(/\/api\/v1\/?$/, "") || "";
  
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};
