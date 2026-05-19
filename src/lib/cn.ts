export type ClassValue = string | number | false | null | undefined;

/** Tiny class joiner. Swap for tailwind-merge once we need conflict resolution. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
