import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple hash function to generate stable keys from content
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Format duration between two timestamps in seconds (ceiled to whole number)
export function formatDuration(start?: string, end?: string): string | null {
  if (!start || !end) return null;
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.ceil(duration / 1000);
  return `${seconds}s`;
}

// Calculate duration in seconds between two timestamps
export function calculateDurationInSeconds(start?: string, end?: string): number | null {
  if (!start) return null;
  const endTime = end || new Date().toISOString();
  const duration = new Date(endTime).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(duration / 1000));
}
