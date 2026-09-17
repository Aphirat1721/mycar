/**
 * Identity/session boundary.
 *
 * This compatibility layer preserves the existing MyCar session contract in
 * Phase 2 while giving Portal code a stable module boundary.
 */
export {
  createSession,
  destroySession,
  getCurrentUser,
  requireUser,
  hasRole,
} from "@/lib/session";
