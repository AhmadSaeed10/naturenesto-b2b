// Safe for client components: no database or server imports here.

/** Areas an owner can tick for a "member" invite, in the order they are listed. Keys of ACCESS. */
export const MEMBER_AREAS = [
  "catalog",
  "content",
  "media",
  "orders",
  "customers",
  "reviews",
] as const;
export type MemberArea = (typeof MEMBER_AREAS)[number];
export const isMemberArea = (value: string): value is MemberArea =>
  (MEMBER_AREAS as readonly string[]).includes(value);
