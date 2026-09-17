/**
 * Identity boundary for Provider ID authentication.
 *
 * Phase 2 intentionally re-exports the existing implementation so current
 * MyCar authentication routes remain behavior-compatible. Future phases can
 * move the implementation here without changing callers.
 */
export {
  authenticateProviderCode,
  healthIdAuthorizationUrl,
} from "@/lib/provider-id";
export type { ProviderProfile } from "@/lib/provider-id";
