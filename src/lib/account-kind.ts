import type { Role } from "@/data/catalog";

export type AccountKind = "musician" | "agency" | "member";

/** Missing kind stays a musician, so profiles saved before this choice keep their listing. */
export function accountKindOf(user: { accountKind?: string | null }): AccountKind {
  return user.accountKind === "agency" || user.accountKind === "member" ? user.accountKind : "musician";
}

export function roleLabelKey(user: {
  accountKind?: string | null;
  roles?: readonly string[] | null;
}): "roles.agency" | "roles.member" | `roles.${Role}` {
  const kind = accountKindOf(user);
  if (kind === "agency") return "roles.agency";
  if (kind === "member") return "roles.member";
  const role = user.roles?.[0];
  if (
    role === "vocalist" ||
    role === "guitarist" ||
    role === "percussion" ||
    role === "flute" ||
    role === "producer" ||
    role === "lyricist"
  ) {
    return `roles.${role}`;
  }
  return "roles.member";
}
