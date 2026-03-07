"use client";

export const formatCountdown = (expiresAt?: string) => {
  if (!expiresAt) return "Join window closed";
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Join window closed";

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s left`;
};
