import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Student } from "../api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trailing number of a display ID — "CS-35" and "35" both yield "35".
 * Used for the compact labels where the initials prefix is just noise.
 */
export function displayNumber(displayId?: string | null): string {
  return displayId?.split("-").pop() || "";
}

/**
 * Seats one student occupies — themselves plus any family joining them.
 * `familySize` counts family only, and defaults to 1 on the entity, so it is
 * read only when `isFamily` is set. Mirrors the server's mapping logic.
 */
export function studentSeats(student: Pick<Student, "isFamily" | "familySize">): number {
  return 1 + (student.isFamily ? student.familySize : 0);
}

/** Total seats a group of students occupies, family included. */
export function seatCount(students: Pick<Student, "isFamily" | "familySize">[]): number {
  return students.reduce((sum, s) => sum + studentSeats(s), 0);
}
