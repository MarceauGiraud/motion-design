/**
 * Placeholder logo ("ACME"), vector paths. Replace with your own logo:
 * keep the same frames so LogoReveal / Watermark / EndCard keep working.
 * Symbol: viewBox 0 0 68 104. Wordmark: same frame as the horizontal logo (0 0 359 104),
 * drawn 4 units low and shifted up by -4 when rendered.
 */

/** The symbol. Two sub-paths: outline + counter, fill-rule evenodd. */
export const SYMBOL_PATH =
  'M14 18H54A14 14 0 0 1 68 32V72A14 14 0 0 1 54 86H14A14 14 0 0 1 0 72V32A14 14 0 0 1 14 18Z' +
  'M34 36A16 16 0 1 0 34 68A16 16 0 1 0 34 36Z'
export const SYMBOL_VIEWBOX = { width: 68, height: 104 } as const

/** Letters A, C, M, E in reading order (359 x 104 frame, -4 y offset). */
export const WORDMARK_LETTERS: readonly string[] = [
  'M96 90L120 21H134L158 90H144L139 75H115L110 90ZM119 63H135L127 38Z',
  'M166 21H222V35H180V76H222V90H166Z',
  'M230 90V21H244L261 48L278 21H292V90H278V46L261 72L244 46V90Z',
  'M300 21H352V35H314V48H346V62H314V76H352V90H300Z',
]
/** Wordmark box in the file frame (after the -4 offset). */
export const WORDMARK_BOX = { x: 92, y: 17, width: 267, height: 69.4 } as const
/** Frame of the full horizontal logo. */
export const HORIZ_VIEWBOX = { width: 359, height: 104 } as const
