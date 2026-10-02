/**
 * Palette locale du module UI : neutres et couleurs d'état qui n'existent pas
 * dans BRAND (blanc pur, verts/ambres de statut, verre macOS).
 */
export const UI_PALETTE = {
  white: '#FFFFFF',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  neutralSoft: '#EEF0F3',
  /** Fond des notifications macOS (clair, translucide). */
  glassLight: 'rgba(246,245,244,0.86)',
  /** Verre sombre. */
  glassDark: 'rgba(28,27,30,0.78)',
  /** Carte d'annotation en verre sur fond nuit (navy DA). */
  glassNavy: 'rgba(14,17,38,0.8)',
  /** Pastille d'icône bleue sur verre sombre (BRAND.blue à 26 %). */
  blueGlass: 'rgba(37,99,235,0.26)',
  /** Filet bleu des pastilles d'icône (BRAND.blue à 16 %). */
  blueHairline: 'rgba(37,99,235,0.16)',
  /** Bleu clair lisible sur verre sombre (Tailwind blue-300). */
  blueOnDark: '#93C5FD',
  /** Touche de clavier (clair). */
  keyTop: '#FBFBFA',
  keyTopEnd: '#EDECEA',
  keyEdge: '#CFCCC8',
  /** Touche de clavier (sombre). */
  keyTopDark: '#2B2A2F',
  keyTopDarkEnd: '#1E1D22',
  keyEdgeDark: '#0C0B0F',
} as const
