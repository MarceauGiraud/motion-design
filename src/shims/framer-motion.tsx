/**
 * framer-motion, version Remotion.
 *
 * Le mockup du website (src/platform/**) est copié tel quel et importe
 * `framer-motion`. Framer anime sur l'horloge murale : en rendu vidéo, deux
 * rendus de la même frame ne donneraient pas la même image. Ce module est
 * substitué à framer-motion par l'alias webpack (remotion.config.ts) et
 * RECALCULE chaque animation à partir de `useCurrentFrame()`.
 *
 * Ce qui est rejoué fidèlement :
 *   - initial -> animate (objets, labels de variants, variants fonctions + custom)
 *   - propagation des labels aux enfants, delayChildren / staggerChildren
 *   - transitions tween (duration, delay, ease nommé ou cubic-bezier) et spring
 *     (stiffness, damping, mass), keyframes, valeurs px / % / couleurs
 *   - x / y / scale / rotate... convertis en `transform`, MotionValue dans `style`
 *
 * Ce qui est ignoré (sans effet en vidéo) : exit, whileHover/Tap/Drag, drag,
 * layout / layoutId. AnimatePresence rend simplement ses enfants.
 *
 * Le temps 0 d'une animation est la frame 0 de la <Sequence> englobante :
 * placer une scène dans une Sequence rejoue donc son entrée. <MotionClock>
 * permet de décaler, d'accélérer ou de figer (mode "static") ce temps.
 */
import {
  createContext,
  forwardRef,
  Fragment,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type SVGAttributes,
} from 'react'
import { Easing as RemotionEasing, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from 'remotion'

// ---------------------------------------------------------------------------
// Horloge
// ---------------------------------------------------------------------------

export interface MotionClockValue {
  /** 'animate' rejoue les entrées, 'static' rend directement l'état final. */
  mode: 'animate' | 'static'
  /** Frames retranchées à la frame courante avant calcul (décale le départ). */
  offset: number
  /** Multiplicateur de vitesse du temps framer (2 = deux fois plus vite). */
  speed: number
  /** Valeur rendue par useReducedMotion(). */
  reducedMotion: boolean
}

const ClockContext = createContext<MotionClockValue>({
  mode: 'animate',
  offset: 0,
  speed: 1,
  reducedMotion: false,
})

export function MotionClock({
  children,
  ...value
}: Partial<MotionClockValue> & { children: ReactNode }) {
  const parent = useContext(ClockContext)
  const merged = useMemo(() => ({ ...parent, ...value }), [parent, value.mode, value.offset, value.speed, value.reducedMotion])
  return <ClockContext.Provider value={merged}>{children}</ClockContext.Provider>
}

/** Temps framer courant, en secondes. */
function useMotionTime(): { t: number; fps: number; mode: MotionClockValue['mode'] } {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const clock = useContext(ClockContext)
  return { t: ((frame - clock.offset) / fps) * clock.speed, fps, mode: clock.mode }
}

// ---------------------------------------------------------------------------
// MotionValue minimal
// ---------------------------------------------------------------------------

export class MotionValue<T = any> {
  private value: T
  constructor(initial: T) {
    this.value = initial
  }
  get(): T {
    return this.value
  }
  set(next: T) {
    this.value = next
  }
  jump(next: T) {
    this.value = next
  }
  getVelocity() {
    return 0
  }
  on() {
    return () => {}
  }
  onChange() {
    return () => {}
  }
  destroy() {}
}

export function motionValue<T>(initial: T) {
  return new MotionValue(initial)
}

export function useMotionValue<T>(initial: T) {
  return useMemo(() => new MotionValue(initial), [])
}

export function useTransform(source: any, input?: any, output?: any, options?: { clamp?: boolean }): MotionValue {
  if (typeof input === 'function') return new MotionValue(input(source?.get?.() ?? source))
  if (typeof source === 'function') return new MotionValue(source())
  const value = source?.get?.() ?? 0
  if (Array.isArray(input) && Array.isArray(output)) {
    const clamp = options?.clamp !== false
    return new MotionValue(
      typeof output[0] === 'number'
        ? interpolate(value, input, output, {
            extrapolateLeft: clamp ? 'clamp' : 'extend',
            extrapolateRight: clamp ? 'clamp' : 'extend',
          })
        : output[0]
    )
  }
  return new MotionValue(value)
}

export function useSpring(source: any) {
  return source instanceof MotionValue ? source : new MotionValue(source)
}
export const useVelocity = (source: any) => new MotionValue(0 * (source?.get?.() ?? 0))
export const useMotionTemplate = (strings: TemplateStringsArray, ...values: any[]) =>
  new MotionValue(strings.reduce((acc, s, i) => acc + s + (i < values.length ? values[i]?.get?.() ?? values[i] : ''), ''))

export function useScroll() {
  return {
    scrollX: new MotionValue(0),
    scrollY: new MotionValue(0),
    scrollXProgress: new MotionValue(0),
    scrollYProgress: new MotionValue(0),
  }
}

export function useReducedMotion(): boolean {
  return useContext(ClockContext).reducedMotion
}
export const useReducedMotionConfig = useReducedMotion
export const useInView = () => true
export const useIsPresent = () => true
export const usePresence = () => [true, () => {}] as const
export const useMotionValueEvent = () => {}
export const useAnimationFrame = () => {}
export const useWillChange = () => new MotionValue('auto')

const noopControls = {
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
  mount: () => () => {},
}
export const useAnimation = () => noopControls
export const useAnimationControls = () => noopControls
export const useAnimate = () => [useRef(null), () => ({ stop: () => {}, then: (fn: () => void) => fn() })] as const
export const useDragControls = () => ({ start: () => {} })
export function animate() {
  return { stop: () => {}, cancel: () => {}, complete: () => {}, then: (fn: () => void) => Promise.resolve().then(fn) }
}
export const stagger = (step: number) => (index: number) => index * step

// ---------------------------------------------------------------------------
// Types exportés, volontairement larges : seul le rendu compte ici.
// ---------------------------------------------------------------------------

export type Variants = Record<string, any>
export type Variant = Record<string, any>
export type Transition = Record<string, any>
export type TargetAndTransition = Record<string, any>
export type MotionProps = Record<string, any>
export type HTMLMotionProps<_T extends string = 'div'> = Record<string, any>
export type MotionStyle = Record<string, any>
export type AnimationControls = typeof noopControls
export type PanInfo = { point: { x: number; y: number }; offset: { x: number; y: number }; delta: { x: number; y: number }; velocity: { x: number; y: number } }
export type Easing = any
export type Spring = Record<string, any>

// ---------------------------------------------------------------------------
// Conteneurs
// ---------------------------------------------------------------------------

const PresenceContext = createContext<{ initial: boolean }>({ initial: true })

export function AnimatePresence({ children, initial = true }: { children?: ReactNode; initial?: boolean; mode?: string; custom?: any; onExitComplete?: () => void }) {
  return <PresenceContext.Provider value={{ initial }}>{children}</PresenceContext.Provider>
}

const ConfigContext = createContext<{ transition?: Transition }>({})

export function MotionConfig({ children, transition }: { children?: ReactNode; transition?: Transition; transformPagePoint?: (point: { x: number; y: number }) => { x: number; y: number }; reducedMotion?: string; nonce?: string }) {
  const parent = useContext(ConfigContext)
  return <ConfigContext.Provider value={{ transition: transition ?? parent.transition }}>{children}</ConfigContext.Provider>
}

export const LayoutGroup = ({ children }: { children?: ReactNode; id?: string }) => <Fragment>{children}</Fragment>
export const LazyMotion = ({ children }: { children?: ReactNode; features?: any; strict?: boolean }) => <Fragment>{children}</Fragment>
export const Reorder = {
  Group: ({ children, as: As = 'ul', values: _v, onReorder: _o, axis: _a, ...rest }: any) => <As {...rest}>{children}</As>,
  Item: ({ children, as: As = 'li', value: _v, ...rest }: any) => <As {...rest}>{children}</As>,
}
export const domAnimation = {}
export const domMax = {}

// ---------------------------------------------------------------------------
// Propagation des variants
// ---------------------------------------------------------------------------

interface VariantScope {
  animate?: string[]
  initial?: string[] | false
  /** Instant (s) où les enfants peuvent démarrer, delayChildren compris. */
  childStart: number
  staggerChildren: number
  staggerDirection: number
  nextIndex: () => number
  count: () => number
}

const VariantContext = createContext<VariantScope | null>(null)

const toLabels = (value: unknown): string[] | undefined =>
  typeof value === 'string' ? [value] : Array.isArray(value) && value.every((v) => typeof v === 'string') ? (value as string[]) : undefined

function resolveVariants(labels: string[] | undefined, variants: Variants | undefined, custom: unknown): Record<string, any> | undefined {
  if (!labels || !variants) return undefined
  let out: Record<string, any> | undefined
  for (const label of labels) {
    let entry = variants[label]
    if (typeof entry === 'function') entry = entry(custom, {}, {})
    if (entry && typeof entry === 'object') out = { ...(out ?? {}), ...entry }
  }
  return out
}

// ---------------------------------------------------------------------------
// Interpolation d'une propriété
// ---------------------------------------------------------------------------

const NAMED_EASE: Record<string, (t: number) => number> = {
  linear: RemotionEasing.linear,
  easeIn: RemotionEasing.bezier(0.42, 0, 1, 1),
  easeOut: RemotionEasing.bezier(0, 0, 0.58, 1),
  easeInOut: RemotionEasing.bezier(0.42, 0, 0.58, 1),
  circIn: RemotionEasing.in(RemotionEasing.circle),
  circOut: RemotionEasing.out(RemotionEasing.circle),
  circInOut: RemotionEasing.inOut(RemotionEasing.circle),
  backIn: RemotionEasing.in(RemotionEasing.back(1.7)),
  backOut: RemotionEasing.out(RemotionEasing.back(1.7)),
  backInOut: RemotionEasing.inOut(RemotionEasing.back(1.7)),
  anticipate: RemotionEasing.bezier(0.36, 0, 0.66, -0.56),
}

function toEase(ease: unknown): (t: number) => number {
  if (Array.isArray(ease) && ease.length === 4 && ease.every((n) => typeof n === 'number')) {
    const [a, b, c, d] = ease as number[]
    return RemotionEasing.bezier(a, b, c, d)
  }
  if (typeof ease === 'function') return ease as (t: number) => number
  if (typeof ease === 'string' && NAMED_EASE[ease]) return NAMED_EASE[ease]
  return NAMED_EASE.easeOut
}

/** Framer anime les transforms en spring par défaut, le reste en tween 0.3s. */
const SPRING_BY_DEFAULT = new Set(['x', 'y', 'z', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ'])

/** Valeurs de départ implicites quand `initial` ne précise pas la propriété. */
const IMPLICIT_FROM: Record<string, number> = {
  opacity: 1, scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, z: 0, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0, skewX: 0, skewY: 0,
}

function progressAt(t: number, delay: number, transition: Transition, key: string, fps: number): number {
  const local = t - delay
  if (local <= 0) return 0
  const isSpring =
    transition.type === 'spring' ||
    transition.stiffness !== undefined ||
    transition.damping !== undefined ||
    transition.bounce !== undefined ||
    transition.visualDuration !== undefined ||
    (transition.type === undefined && transition.duration === undefined && transition.ease === undefined && SPRING_BY_DEFAULT.has(key))

  if (isSpring) {
    const hasPhysics = transition.stiffness !== undefined || transition.damping !== undefined || transition.mass !== undefined
    const seconds = transition.visualDuration ?? transition.duration
    if (!hasPhysics && seconds !== undefined) {
      const bounce = transition.bounce ?? 0.25
      return spring({
        frame: local * fps,
        fps,
        config: { damping: interpolate(bounce, [0, 1], [200, 6], { extrapolateRight: 'clamp' }), stiffness: 120, mass: 1 },
        durationInFrames: Math.max(1, seconds * fps),
      })
    }
    return spring({
      frame: local * fps,
      fps,
      config: {
        stiffness: transition.stiffness ?? 100,
        damping: transition.damping ?? 10,
        mass: transition.mass ?? 1,
        overshootClamping: transition.restDelta === undefined ? false : false,
      },
    })
  }

  const duration = transition.duration ?? 0.3
  if (duration <= 0) return 1
  return toEase(transition.ease)(Math.min(1, local / duration))
}

const NUMBER_WITH_UNIT = /^(-?\d*\.?\d+)([a-z%]*)$/i
const isColor = (v: unknown) => typeof v === 'string' && /^(#|rgb|hsl)/i.test(v.trim())

function mix(from: unknown, to: unknown, p: number): unknown {
  if (typeof from === 'number' && typeof to === 'number') return from + (to - from) * p
  if (isColor(from) && isColor(to)) return interpolateColors(Math.max(0, Math.min(1, p)), [0, 1], [from as string, to as string])
  if (typeof from === 'string' && typeof to === 'string') {
    const a = from.trim().match(NUMBER_WITH_UNIT)
    const b = to.trim().match(NUMBER_WITH_UNIT)
    if (a && b && (a[2] === b[2] || !a[2] || !b[2])) {
      const unit = b[2] || a[2]
      return `${Number(a[1]) + (Number(b[1]) - Number(a[1])) * p}${unit}`
    }
  }
  if (typeof from === 'number' && typeof to === 'string') return mix(`${from}`, to, p)
  if (typeof from === 'string' && typeof to === 'number') return mix(from, `${to}`, p)
  return p < 1 ? from : to
}

function valueAt(from: unknown, to: unknown, p: number, transition: Transition): unknown {
  if (Array.isArray(to)) {
    // Keyframes. `null` en tête = valeur courante.
    const frames = to.map((v, i) => (v === null && i === 0 ? from : v))
    if (frames.length === 1) return frames[0]
    const times: number[] = transition.times ?? frames.map((_, i) => i / (frames.length - 1))
    const clamped = Math.max(0, Math.min(1, p))
    let seg = times.findIndex((time, i) => i > 0 && clamped <= time)
    if (seg < 1) seg = frames.length - 1
    const t0 = times[seg - 1]
    const t1 = times[seg]
    const local = t1 === t0 ? 1 : (clamped - t0) / (t1 - t0)
    return mix(frames[seg - 1], frames[seg], local)
  }
  return mix(from, to, p)
}

const finalOf = (value: unknown) => (Array.isArray(value) ? value[value.length - 1] : value)

// ---------------------------------------------------------------------------
// Style : transforms framer -> CSS
// ---------------------------------------------------------------------------

const TRANSFORM_KEYS = ['x', 'y', 'z', 'translateX', 'translateY', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY', 'transformPerspective']
const px = (v: unknown) => (typeof v === 'number' ? `${v}px` : String(v))
const deg = (v: unknown) => (typeof v === 'number' ? `${v}deg` : String(v))

function toCss(raw: Record<string, any>): CSSProperties {
  const style: Record<string, any> = {}
  const tf: Record<string, any> = {}
  for (const [key, value0] of Object.entries(raw)) {
    const value = value0 instanceof MotionValue ? value0.get() : value0
    if (value === undefined) continue
    if (TRANSFORM_KEYS.includes(key)) tf[key] = value
    else if (key === 'originX' || key === 'originY' || key === 'originZ') continue
    else if (key === 'pathLength' || key === 'pathOffset' || key === 'pathSpacing') continue
    else style[key] = value
  }
  if (raw.originX !== undefined || raw.originY !== undefined) {
    const ox = raw.originX ?? 0.5
    const oy = raw.originY ?? 0.5
    style.transformOrigin = `${typeof ox === 'number' ? `${ox * 100}%` : ox} ${typeof oy === 'number' ? `${oy * 100}%` : oy}`
  }
  const parts: string[] = []
  if (tf.transformPerspective !== undefined) parts.push(`perspective(${px(tf.transformPerspective)})`)
  const tx = tf.x ?? tf.translateX
  const ty = tf.y ?? tf.translateY
  if (tx !== undefined || ty !== undefined || tf.z !== undefined) parts.push(`translate3d(${px(tx ?? 0)}, ${px(ty ?? 0)}, ${px(tf.z ?? 0)})`)
  if (tf.scale !== undefined) parts.push(`scale(${tf.scale})`)
  if (tf.scaleX !== undefined) parts.push(`scaleX(${tf.scaleX})`)
  if (tf.scaleY !== undefined) parts.push(`scaleY(${tf.scaleY})`)
  if (tf.rotate !== undefined) parts.push(`rotate(${deg(tf.rotate)})`)
  if (tf.rotateX !== undefined) parts.push(`rotateX(${deg(tf.rotateX)})`)
  if (tf.rotateY !== undefined) parts.push(`rotateY(${deg(tf.rotateY)})`)
  if (tf.rotateZ !== undefined) parts.push(`rotateZ(${deg(tf.rotateZ)})`)
  if (tf.skewX !== undefined) parts.push(`skewX(${deg(tf.skewX)})`)
  if (tf.skewY !== undefined) parts.push(`skewY(${deg(tf.skewY)})`)
  if (parts.length) style.transform = [style.transform, ...parts].filter(Boolean).join(' ')
  return style as CSSProperties
}

// ---------------------------------------------------------------------------
// Composant motion
// ---------------------------------------------------------------------------

const MOTION_ONLY_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants', 'custom', 'inherit',
  'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView', 'viewport',
  'layout', 'layoutId', 'layoutDependency', 'layoutScroll', 'layoutRoot',
  'drag', 'dragConstraints', 'dragElastic', 'dragMomentum', 'dragSnapToOrigin', 'dragListener',
  'dragControls', 'dragPropagation', 'dragDirectionLock', 'dragTransition',
  'onDrag', 'onDragStart', 'onDragEnd', 'onDirectionLock', 'onDragTransitionEnd',
  'onAnimationStart', 'onAnimationComplete', 'onUpdate', 'onLayoutAnimationStart', 'onLayoutAnimationComplete',
  'onHoverStart', 'onHoverEnd', 'onTap', 'onTapStart', 'onTapCancel', 'onPan', 'onPanStart', 'onPanEnd',
  'onViewportEnter', 'onViewportLeave', 'transformTemplate', 'values',
])

function createMotionComponent(Tag: any) {
  const Component = forwardRef<any, any>(function MotionComponent(props, ref) {
    const { t, fps, mode } = useMotionTime()
    const parent = useContext(VariantContext)
    const presence = useContext(PresenceContext)
    const config = useContext(ConfigContext)
    const { variants, custom, transition: transitionProp, style: styleProp, children } = props

    // Rang parmi les frères, pour staggerChildren. Attribué au montage.
    const [index] = useState(() => (parent && variants ? parent.nextIndex() : 0))
    const counter = useRef(0)
    counter.current = 0

    const ownAnimate = props.animate
    const animateLabels = toLabels(ownAnimate) ?? (ownAnimate === undefined && variants ? parent?.animate : undefined)
    const animateTarget: Record<string, any> | undefined =
      ownAnimate && typeof ownAnimate === 'object' && !Array.isArray(ownAnimate) ? ownAnimate : resolveVariants(animateLabels, variants, custom)

    const ownInitial = props.initial
    const initialDisabled = ownInitial === false || (!presence.initial && ownInitial === undefined) || (ownInitial === undefined && parent?.initial === false && !!variants)
    const initialLabels = initialDisabled ? undefined : toLabels(ownInitial) ?? (ownInitial === undefined && variants && parent?.initial ? parent.initial : undefined)
    const initialTarget: Record<string, any> | undefined = initialDisabled
      ? undefined
      : ownInitial && typeof ownInitial === 'object' && !Array.isArray(ownInitial)
        ? ownInitial
        : resolveVariants(initialLabels, variants, custom)

    const { transition: targetTransition, transitionEnd, ...targetValues } = animateTarget ?? {}
    const transition: Transition = { ...(config.transition ?? {}), ...(transitionProp ?? {}), ...(targetTransition ?? {}) }

    // Départ de CET élément : délai hérité (orchestration du parent) + le sien.
    const inherited = parent && variants && ownAnimate === undefined
      ? parent.childStart + (parent.staggerDirection < 0 ? parent.count() - 1 - index : index) * parent.staggerChildren
      : 0
    const start = inherited + (transition.delay ?? 0)

    const animated: Record<string, any> = {}
    for (const [key, to] of Object.entries(targetValues)) {
      if (mode === 'static' || !initialTarget) {
        animated[key] = finalOf(to)
        continue
      }
      const from = key in initialTarget ? finalOf(initialTarget[key]) : IMPLICIT_FROM[key] ?? finalOf(to)
      const perKey: Transition = transition[key] && typeof transition[key] === 'object' ? { ...transition, ...transition[key] } : transition
      const p = progressAt(t, inherited + (perKey.delay ?? 0), perKey, key, fps)
      animated[key] = valueAt(from, to, p, perKey)
    }
    if (transitionEnd && mode === 'static') Object.assign(animated, transitionEnd)
    // Propriétés présentes dans `initial` mais absentes de la cible : on les garde.
    if (initialTarget && mode !== 'static') {
      for (const [key, value] of Object.entries(initialTarget)) {
        if (key !== 'transition' && !(key in animated)) animated[key] = finalOf(value)
      }
    }

    const scope = useMemo<VariantScope>(
      () => ({
        animate: animateLabels,
        initial: initialDisabled ? false : initialLabels,
        childStart: start + (transition.delayChildren ?? 0),
        staggerChildren: transition.staggerChildren ?? 0,
        staggerDirection: transition.staggerDirection ?? 1,
        nextIndex: () => counter.current++,
        count: () => counter.current,
      }),
      [animateLabels?.join('|'), initialDisabled, initialLabels?.join('|'), start, transition.delayChildren, transition.staggerChildren, transition.staggerDirection]
    )

    const rest: Record<string, any> = {}
    for (const [key, value] of Object.entries(props)) {
      if (!MOTION_ONLY_PROPS.has(key) && key !== 'style' && key !== 'children') rest[key] = value
    }
    const style = toCss({ ...(styleProp ?? {}), ...animated })

    return (
      <VariantContext.Provider value={scope}>
        <Tag ref={ref} {...rest} style={style}>
          {children}
        </Tag>
      </VariantContext.Provider>
    )
  })
  Component.displayName = `motion.${typeof Tag === 'string' ? Tag : Tag.displayName ?? 'Component'}`
  return Component
}

const cache = new Map<any, any>()
function getMotion(tag: any) {
  if (!cache.has(tag)) cache.set(tag, createMotionComponent(tag))
  return cache.get(tag)
}

/** Props d'un élément motion : attributs DOM typés + props framer (larges). */
export type MotionElementProps = Omit<HTMLAttributes<any> & SVGAttributes<any>, 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> & {
  ref?: Ref<any>
  style?: Record<string, any>
  onDrag?: (event: PointerEvent, info: PanInfo) => void
  onDragStart?: (event: PointerEvent, info: PanInfo) => void
  onDragEnd?: (event: PointerEvent, info: PanInfo) => void
  onAnimationStart?: (definition: any) => void
  [key: string]: any
}
type MotionComponent = ComponentType<MotionElementProps>
type MotionFactory = { create: (component: any) => MotionComponent } & Record<string, MotionComponent>

export const motion: MotionFactory = new Proxy({} as MotionFactory, {
  get(_target, key: string) {
    if (key === 'create' || key === 'custom') return (component: any) => getMotion(component)
    return getMotion(key)
  },
})
export const m = motion
