/**
 * Demo authentication shim.
 *
 * Session state is intentionally isolated behind this module: replacing it with
 * Supabase Auth (or an SSO provider) only requires re-implementing these four
 * functions. Role information is already carried so RBAC can be layered on.
 */
import { useEffect, useState } from "react";
import { getUser } from "./service";
import type { User } from "./types";

const KEY = "sentinelgrid.session";

export interface Session {
  badge_id: string;
  role: User["role"];
  issued_at: string;
}

export function signIn(badgeId: string): Session {
  const session: Session = {
    badge_id: badgeId || getUser().badge_id,
    role: getUser().role,
    issued_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** `null` while hydrating, then the session or `false` when unauthenticated. */
export function useSession() {
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({
    ready: false,
    session: null,
  });
  useEffect(() => {
    setState({ ready: true, session: readSession() });
  }, []);
  return state;
}
