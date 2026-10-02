/**
 * Icônes pour <IconMorph>. Données lucide (ISC, lucide-react 0.540) recopiées
 * au format IconNode : [balise, attributs]. Toute icône lucide peut être
 * passée telle quelle (`import { __iconNode } from 'lucide-react/dist/esm/icons/xxx'`).
 */
import { circlePath, roundedRectPath } from './shapes'

export type IconElement = [tag: string, attrs: Record<string, string>]
export type IconNode = IconElement[]

export const ICONS = {
  play: [['path', { d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z' }]],
  pause: [
    ['rect', { x: '14', y: '3', width: '5', height: '18', rx: '1' }],
    ['rect', { x: '5', y: '3', width: '5', height: '18', rx: '1' }],
  ],
  check: [['path', { d: 'M20 6 9 17l-5-5' }]],
  plus: [['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]],
  x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
  menu: [['path', { d: 'M4 12h16' }], ['path', { d: 'M4 18h16' }], ['path', { d: 'M4 6h16' }]],
  'arrow-right': [['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]],
  sparkles: [
    ['path', { d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' }],
    ['path', { d: 'M20 2v4' }],
    ['path', { d: 'M22 4h-4' }],
    ['circle', { cx: '4', cy: '20', r: '2' }],
  ],
  search: [['path', { d: 'm21 21-4.34-4.34' }], ['circle', { cx: '11', cy: '11', r: '8' }]],
  mail: [['path', { d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' }], ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }]],
  bell: [
    ['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }],
    ['path', { d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' }],
  ],
  heart: [['path', { d: 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5' }]],
  send: [
    ['path', { d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z' }],
    ['path', { d: 'm21.854 2.147-10.94 10.939' }],
  ],
  zap: [['path', { d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' }]],
  user: [['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }], ['circle', { cx: '12', cy: '7', r: '4' }]],
  users: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['path', { d: 'M16 3.128a4 4 0 0 1 0 7.744' }],
    ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
    ['circle', { cx: '9', cy: '7', r: '4' }],
  ],
  'message-circle': [['path', { d: 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719' }]],
  calendar: [['path', { d: 'M8 2v4' }], ['path', { d: 'M16 2v4' }], ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }], ['path', { d: 'M3 10h18' }]],
  star: [['path', { d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }]],
  'circle-check': [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm9 12 2 2 4-4' }]],
  circle: [['circle', { cx: '12', cy: '12', r: '10' }]],
} satisfies Record<string, IconNode>

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]

const num = (a: Record<string, string>, k: string, d = 0) => (a[k] === undefined ? d : parseFloat(a[k]))

/** IconNode (lucide) -> liste de `d`. Gère path, circle, ellipse, rect, line, polyline, polygon. */
export function iconNodeToPaths(node: IconNode): string[] {
  const out: string[] = []
  for (const [tag, a] of node) {
    switch (tag) {
      case 'path':
        out.push(a.d)
        break
      case 'circle':
        out.push(circlePath(num(a, 'cx'), num(a, 'cy'), num(a, 'r')))
        break
      case 'ellipse': {
        const cx = num(a, 'cx')
        const cy = num(a, 'cy')
        const rx = num(a, 'rx')
        const ry = num(a, 'ry')
        out.push(`M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`)
        break
      }
      case 'rect':
        out.push(roundedRectPath(num(a, 'x'), num(a, 'y'), num(a, 'width'), num(a, 'height'), num(a, 'rx', num(a, 'ry'))))
        break
      case 'line':
        out.push(`M${num(a, 'x1')} ${num(a, 'y1')}L${num(a, 'x2')} ${num(a, 'y2')}`)
        break
      case 'polyline':
      case 'polygon': {
        const p = (a.points ?? '').trim().split(/[\s,]+/).map(Number)
        let d = ''
        for (let i = 0; i + 1 < p.length; i += 2) d += `${i === 0 ? 'M' : 'L'}${p[i]} ${p[i + 1]}`
        out.push(tag === 'polygon' ? `${d}Z` : d)
        break
      }
      default:
        break
    }
  }
  return out
}

export type IconInput = IconName | IconNode

export function resolveIcon(i: IconInput): string[] {
  return iconNodeToPaths(typeof i === 'string' ? ICONS[i] : i)
}
