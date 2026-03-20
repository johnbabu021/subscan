import { clsx } from "clsx";
import { type ClassValue, clsx as cn } from "clsx";
import twMerge from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}