"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  userId: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const DEFAULT_USERS: Record<Role, string> = {
  owner: "u1",
  team: "u2",
  client: "u8",
};

export function RoleProvider({ children, initial = "owner" }: { children: ReactNode; initial?: Role }) {
  const [role, setRoleState] = useState<Role>(initial);
  const setRole = (r: Role) => setRoleState(r);
  const userId = DEFAULT_USERS[role];
  return <RoleContext.Provider value={{ role, setRole, userId }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    return { role: "owner" as Role, setRole: () => {}, userId: "u1" };
  }
  return ctx;
}

export function useCurrentUser() {
  const { userId } = useRole();
  const storeUsers = useStore((s) => s.users);
  return storeUsers.find((u) => u.id === userId) ?? storeUsers[0];
}
