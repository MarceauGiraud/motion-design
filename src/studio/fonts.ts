/**
 * Fonts. Both come from Google Fonts (free licence), loaded by @remotion/google-fonts.
 * loadFont() blocks rendering until loaded: no frame ever renders in a fallback font.
 *
 * To use your own brand font, drop the .woff2 files in public/fonts and load them with
 * `loadFont` from '@remotion/fonts' + staticFile(), then change FONT_DISPLAY.
 */
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight'

loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext'] })
loadInterTight('normal', { weights: ['300', '400', '500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] })

export const FONT_DISPLAY = "'Inter Tight', 'Inter', system-ui, sans-serif"
export const FONT_BODY = "'Inter', system-ui, sans-serif"
