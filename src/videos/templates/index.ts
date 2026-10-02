/** Templates de l'usine vidéo : composants paramétriques + schémas zod + durées. */
export { TemplatesCatalog } from './catalog'
export { FeatureSpotlight, featureSpotlightSchema, featureSpotlightDefaults, featureSpotlightDuration, type FeatureSpotlightProps } from './FeatureSpotlight'
export {
  SocialTeaser,
  socialTeaserSchema,
  socialTeaserDefaults,
  socialTeaserPortraitDefaults,
  socialTeaserDuration,
  type SocialTeaserProps,
} from './SocialTeaser'
export { Changelog, changelogSchema, changelogDefaults, changelogDuration, type ChangelogProps, type ChangelogItem } from './Changelog'
export { MetricsHighlight, metricsHighlightSchema, metricsHighlightDefaults, metricsHighlightDuration, type MetricsHighlightProps } from './MetricsHighlight'
export {
  Backdrop,
  EndScene,
  Eyebrow,
  makeTransition,
  seriesDuration,
  zEnd,
  zAssistantAction,
  zRect,
  zScene,
  zTheme,
  zTransition,
  DEFAULT_END,
  type EndProps,
  type SceneKey,
  type Theme,
} from './shared'
