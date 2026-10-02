/**
 * Remotion config.
 *
 *   framer-motion -> src/shims/framer-motion.tsx   (frame-driven, deterministic)
 *   next/image    -> src/shims/next-image.tsx      (<Img> + staticFile)
 *
 * Those two aliases let you paste React mockups written for a Next.js site
 * (framer-motion + next/image) and render them frame-accurately: the shim
 * recomputes every animation from useCurrentFrame() instead of the wall clock.
 */
import path from 'node:path'
import { Config } from '@remotion/cli/config'
import { enableTailwind } from '@remotion/tailwind-v4'

Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(95)
Config.setOverwriteOutput(true)
Config.setConcurrency(null)

Config.overrideWebpackConfig((current) => {
  const withTailwind = enableTailwind(current)
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        'framer-motion$': path.resolve(process.cwd(), 'src/shims/framer-motion.tsx'),
        'next/image$': path.resolve(process.cwd(), 'src/shims/next-image.tsx'),
      },
    },
  }
})
