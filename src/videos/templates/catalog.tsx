/**
 * Templates de l'usine vidéo (dossier Studio : Templates).
 * Chaque composition a un schéma zod : on édite textes, scène, cadrages et
 * transitions dans le panneau Props du Studio, puis on rend sans code.
 * La durée est recalculée à partir des props (calculateMetadata).
 */
import { Composition, Folder } from 'remotion'
import { FORMATS, FPS } from '../../motion/tokens'
import { FeatureSpotlight, featureSpotlightDefaults, featureSpotlightDuration, featureSpotlightSchema } from './FeatureSpotlight'
import { SocialTeaser, socialTeaserDefaults, socialTeaserDuration, socialTeaserPortraitDefaults, socialTeaserSchema } from './SocialTeaser'
import { Changelog, changelogDefaults, changelogDuration, changelogSchema } from './Changelog'
import { MetricsHighlight, metricsHighlightDefaults, metricsHighlightDuration, metricsHighlightSchema } from './MetricsHighlight'

const L = FORMATS.landscape

export const TemplatesCatalog = () => (
  <Folder name="Templates">
    <Composition
      id="Template-FeatureSpotlight"
      component={FeatureSpotlight}
      schema={featureSpotlightSchema}
      defaultProps={featureSpotlightDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: featureSpotlightDuration(props) })}
      durationInFrames={featureSpotlightDuration(featureSpotlightDefaults)}
      fps={FPS}
      width={L.width}
      height={L.height}
    />
    <Composition
      id="Template-SocialTeaser-Square"
      component={SocialTeaser}
      schema={socialTeaserSchema}
      defaultProps={socialTeaserDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: socialTeaserDuration(props) })}
      durationInFrames={socialTeaserDuration(socialTeaserDefaults)}
      fps={FPS}
      width={FORMATS.square.width}
      height={FORMATS.square.height}
    />
    <Composition
      id="Template-SocialTeaser-Portrait"
      component={SocialTeaser}
      schema={socialTeaserSchema}
      defaultProps={socialTeaserPortraitDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: socialTeaserDuration(props) })}
      durationInFrames={socialTeaserDuration(socialTeaserPortraitDefaults)}
      fps={FPS}
      width={FORMATS.portrait.width}
      height={FORMATS.portrait.height}
    />
    <Composition
      id="Template-Changelog"
      component={Changelog}
      schema={changelogSchema}
      defaultProps={changelogDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: changelogDuration(props) })}
      durationInFrames={changelogDuration(changelogDefaults)}
      fps={FPS}
      width={L.width}
      height={L.height}
    />
    <Composition
      id="Template-MetricsHighlight"
      component={MetricsHighlight}
      schema={metricsHighlightSchema}
      defaultProps={metricsHighlightDefaults}
      calculateMetadata={({ props }) => ({ durationInFrames: metricsHighlightDuration(props) })}
      durationInFrames={metricsHighlightDuration(metricsHighlightDefaults)}
      fps={FPS}
      width={L.width}
      height={L.height}
    />
  </Folder>
)
