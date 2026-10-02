/**
 * next/image, version Remotion. Les chemins absolus du website ("/images/…")
 * pointent vers public/, servis ici par staticFile(). <Img> attend le
 * chargement de l'image avant de rendre la frame.
 */
import { forwardRef, type CSSProperties } from 'react'
import { Img, staticFile } from 'remotion'

type Props = {
  src: string | { src: string }
  alt?: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  style?: CSSProperties
  [key: string]: any
}

const OMIT = ['priority', 'quality', 'placeholder', 'blurDataURL', 'loader', 'unoptimized', 'sizes', 'fetchPriority', 'loading', 'overrideSrc']

const Image = forwardRef<HTMLImageElement, Props>(function Image({ src, fill, style, ...props }, ref) {
  const raw = typeof src === 'string' ? src : src.src
  const resolved = raw.startsWith('/') ? staticFile(raw.slice(1)) : raw
  const rest: Record<string, any> = {}
  for (const [k, v] of Object.entries(props)) if (!OMIT.includes(k)) rest[k] = v
  return (
    <Img
      ref={ref}
      src={resolved}
      // Un chargement figé ne doit pas bloquer tout le rendu : on relance l'image après 8 s.
      delayRenderTimeoutInMilliseconds={8000}
      delayRenderRetries={3}
      {...rest}
      style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
    />
  )
})

export default Image
export type StaticImageData = { src: string; width: number; height: number }
