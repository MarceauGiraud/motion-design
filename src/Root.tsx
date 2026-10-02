import './studio/styles.css'
import './studio/fonts'

import { Composition, Folder } from 'remotion'

import { PlatformScreen, PlatformWindow, PLATFORM_WIDTH } from './kit/Platform'
import { Catalog as PrimitivesCatalog } from './motion/primitives/catalog'
import { Catalog as TextCatalog } from './motion/text/catalog'
import { Catalog as TransitionsCatalog } from './motion/transitions/catalog'
import { Catalog as MorphCatalog } from './motion/morph/catalog'
import { Catalog as CameraCatalog } from './motion/camera/catalog'
import { Catalog as UiCatalog } from './motion/ui/catalog'
import { Catalog as BackgroundsCatalog } from './motion/backgrounds/catalog'
import { Catalog as BrandCatalog } from './motion/brand/catalog'
import { Catalog as AudioCatalog } from './motion/audio/catalog'
import { TemplatesCatalog } from './videos/templates/catalog'

/** A placeholder screen, to check your own mockup once you swap src/kit/Platform.tsx. */
const PlatformPreview = () => (
  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#F4F2F0' }}>
    <PlatformWindow width={PLATFORM_WIDTH} variant="clean">
      <PlatformScreen scene="companies" assistant={{ openAt: 30, askAt: 50 }} />
    </PlatformWindow>
  </div>
)

/**
 * Each module declares its compositions in its own `catalog.tsx`
 * (one <Folder> per module). This file only mounts them.
 */
export const RemotionRoot = () => (
  <>
    <Folder name="Videos">
      <TemplatesCatalog />
    </Folder>
    <Folder name="Catalog">
      <PrimitivesCatalog />
      <TextCatalog />
      <TransitionsCatalog />
      <MorphCatalog />
      <CameraCatalog />
      <UiCatalog />
      <BackgroundsCatalog />
      <BrandCatalog />
      <AudioCatalog />
    </Folder>
    <Folder name="Platform">
      <Composition id="PlatformPreview" component={PlatformPreview} durationInFrames={300} fps={30} width={1920} height={1080} />
    </Folder>
  </>
)
