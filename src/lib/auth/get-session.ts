import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, validateSessionToken, SessionContext } from "./session";

/**
 * Retrieves the authenticated session context for the active request.
 * Server-only helper using Next.js cookies().
 */
export async function getCurrentSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validateSessionToken(token);
}
