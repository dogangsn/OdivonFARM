/** Derlenen sürümün bilgisi (public/version.json ile aynı yapı). */
export interface BuildInfo {
  version: string;
  commit: string;
  builtAt: string;
  buildId: string;
  notes?: string;
  forceLogout?: boolean;
  minVersion?: string | null;
}
