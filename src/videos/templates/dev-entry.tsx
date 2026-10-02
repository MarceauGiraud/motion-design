/**
 * Point d'entrée autonome : ne monte QUE les templates (bundle plus léger,
 * rendu indépendant du reste du catalogue).
 *   npx remotion studio src/videos/templates/dev-entry.tsx
 *   npx remotion still src/videos/templates/dev-entry.tsx Template-FeatureSpotlight out.png
 */
import '../../studio/styles.css'
import '../../studio/fonts'
import { registerRoot } from 'remotion'
import { TemplatesCatalog } from './catalog'

registerRoot(TemplatesCatalog)
