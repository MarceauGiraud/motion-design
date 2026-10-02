/**
 * Placeholder "app" used by every demo of the kit: a generic SaaS window
 * (sidebar, topbar, four scenes, AI assistant panel, ⌘K search) on a native
 * 1440 x 900 canvas. Everything is a pure function of useCurrentFrame().
 *
 *   <PlatformScreen scene="companies" />
 *   <PlatformScreen scene="companies" assistant={{ openAt: 20, askAt: 45 }} />
 *
 * Swap this file for your own product mockup: the camera, morph and transition
 * modules only rely on PlatformScreen / PlatformWindow / PLATFORM_WIDTH / PLATFORM_HEIGHT.
 */
import type { CSSProperties, ReactNode } from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const PLATFORM_WIDTH = 1440
export const PLATFORM_HEIGHT = 900

export const HERO_SHELL_TONE = { wing: '#FDFDFC', page: '#F6F5F3', line: '#E7E5E4' } as const

export type PlatformSceneKey = 'companies' | 'inbox' | 'contact' | 'pipeline'

// Fixed layout: every size below is explicit so PLATFORM_REGIONS is exact.
const SIDEBAR_W = 232
const TOPBAR_H = 56
const PAD = 32
const TITLE_H = 52
const ROW_H = 56
const TABLE_HEAD_H = 44
const COL_GAP = 16
const COL_W = (PLATFORM_WIDTH - SIDEBAR_W - PAD * 2 - COL_GAP * 3) / 4
const COL_HEAD_H = 36
const CARD_H = 80
const CARD_GAP = 10
const INBOX_LIST_W = 420
const CONTACT_CARD_W = 360
const CONTACT_HEAD_H = 170
const FIELD_H = 41

type Rect = { x: number; y: number; w: number; h: number }
const colX = (c: number) => SIDEBAR_W + PAD + c * (COL_W + COL_GAP)
const card = (c: number, i: number): Rect => ({ x: colX(c) + 12, y: TOPBAR_H + PAD + TITLE_H + 12 + COL_HEAD_H + i * (CARD_H + CARD_GAP), w: COL_W - 24, h: CARD_H })

/** Notable regions of the placeholder app (1440 x 900 coordinates), for camera focus, cursor, spotlight. */
export const PLATFORM_REGIONS = {
  companies: {
    sidebar: { x: 0, y: 0, w: SIDEBAR_W, h: PLATFORM_HEIGHT },
    search: { x: SIDEBAR_W + 24, y: 11, w: 360, h: 34 },
    createButton: { x: PLATFORM_WIDTH - PAD - 150, y: TOPBAR_H + PAD, w: 150, h: 36 },
    header: { x: SIDEBAR_W + PAD, y: TOPBAR_H + PAD + TITLE_H, w: PLATFORM_WIDTH - SIDEBAR_W - PAD * 2, h: TABLE_HEAD_H },
    firstRows: { x: SIDEBAR_W + PAD, y: TOPBAR_H + PAD + TITLE_H + TABLE_HEAD_H, w: PLATFORM_WIDTH - SIDEBAR_W - PAD * 2, h: ROW_H * 3 },
  },
  pipeline: {
    stages: { x: SIDEBAR_W + PAD, y: TOPBAR_H + PAD + TITLE_H, w: PLATFORM_WIDTH - SIDEBAR_W - PAD * 2, h: COL_HEAD_H + 12 },
    leadColumn: { x: colX(0), y: TOPBAR_H + PAD + TITLE_H, w: COL_W, h: 600 },
    cardNorthwind: card(0, 0),
    cardGlobex: card(1, 0),
    cardInitech: card(2, 0),
    cardWayne: card(2, 1),
    cardUmbrella: card(3, 0),
  },
  inbox: {
    threadList: { x: SIDEBAR_W, y: TOPBAR_H, w: INBOX_LIST_W, h: PLATFORM_HEIGHT - TOPBAR_H },
    firstThread: { x: SIDEBAR_W, y: TOPBAR_H, w: INBOX_LIST_W, h: 92 },
    bubbleFirst: { x: SIDEBAR_W + INBOX_LIST_W + 40, y: TOPBAR_H + 40 + 90, w: PLATFORM_WIDTH - SIDEBAR_W - INBOX_LIST_W - 80, h: 220 },
  },
  contact: {
    card: { x: SIDEBAR_W + 40, y: TOPBAR_H + 40, w: CONTACT_CARD_W, h: CONTACT_HEAD_H + FIELD_H * 6 + 24 },
    fields: { x: SIDEBAR_W + 40 + 24, y: TOPBAR_H + 40 + CONTACT_HEAD_H, w: CONTACT_CARD_W - 48, h: FIELD_H * 6 },
    activity: { x: SIDEBAR_W + 40 + CONTACT_CARD_W + 28, y: TOPBAR_H + 40, w: PLATFORM_WIDTH - SIDEBAR_W - 80 - CONTACT_CARD_W - 28, h: 4 * 72 },
  },
} as const satisfies Record<string, Record<string, Rect>>

const INK = '#111827'
const MUTED = '#6B7280'
const ACCENT = '#2563EB'
const FONT = "'Inter', system-ui, sans-serif"

/** Progress 0→1 clamped between two frames. */
export const between = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

// ---------------------------------------------------------------------------
// Assistant
// ---------------------------------------------------------------------------

export interface AssistantScript {
  /** Frame the panel opens. */
  openAt: number
  /** Frame the prompt starts typing. */
  askAt?: number
  /** Frame the panel closes. Absent = stays open. */
  closeAt?: number
  /** `enrich` adds three rows to the companies table once answered. */
  action?: 'enrich' | 'summarize'
  prompt?: string
  /** Typing speed, characters per second. */
  typingCps?: number
}

const PROMPTS = {
  enrich: 'Find three similar companies and add them to the table',
  summarize: 'Summarize this week in three bullet points',
} as const

const THOUGHTS = ['Reading the workspace…', 'Searching sources…', 'Writing the answer…']
const ANSWERS = {
  enrich: 'Done: three companies added and enriched.',
  summarize: '• 12 new deals\n• 4 meetings booked\n• Pipeline up 18%',
} as const

const PANEL_WIDTH = 380

function useAssistant(script: AssistantScript | undefined) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (!script) return { open: false, draft: '', sent: false, thoughts: 0, answered: false, answerAt: null as number | null, closing: 0 }
  const action = script.action ?? 'enrich'
  const prompt = script.prompt ?? PROMPTS[action]
  const cps = script.typingCps ?? 38
  const closing = script.closeAt !== undefined ? spring({ frame: frame - script.closeAt, fps, config: { stiffness: 320, damping: 34 } }) : 0
  const open = frame >= script.openAt && (script.closeAt === undefined || frame < script.closeAt + fps * 0.4)
  if (script.askAt === undefined || frame < script.askAt) return { open, draft: '', sent: false, thoughts: 0, answered: false, answerAt: null, closing }
  const sendAt = script.askAt + (prompt.length / cps) * fps + 0.42 * fps
  const answerAt = Math.round(sendAt + (2 * 0.76 + 0.9) * fps)
  const draft = frame < sendAt ? prompt.slice(0, Math.floor(((frame - script.askAt) / fps) * cps)) : prompt
  const thoughts = frame < sendAt ? 0 : Math.min(3, 1 + Math.floor((frame - sendAt) / (0.76 * fps)))
  return { open, draft, sent: frame >= sendAt, thoughts, answered: frame >= answerAt, answerAt, closing }
}

// ---------------------------------------------------------------------------
// Entrance helper
// ---------------------------------------------------------------------------

function useEnter(index: number, delay: number, mode: 'animate' | 'static') {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (mode === 'static') return { opacity: 1, transform: 'none' }
  const p = spring({ frame: frame - delay - index * 3, fps, config: { stiffness: 220, damping: 26 } })
  return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` }
}

function Enter({ i, delay, mode, children, style }: { i: number; delay: number; mode: 'animate' | 'static'; children: ReactNode; style?: CSSProperties }) {
  const s = useEnter(i, delay, mode)
  return <div style={{ ...style, ...s }}>{children}</div>
}

// ---------------------------------------------------------------------------
// Scenes (fake data)
// ---------------------------------------------------------------------------

const COMPANIES = [
  ['Northwind', 'Logistics', 'Paris', '€1.2M'],
  ['Globex', 'Manufacturing', 'Lyon', '€860k'],
  ['Initech', 'Software', 'Berlin', '€2.4M'],
  ['Umbrella', 'Healthcare', 'Madrid', '€540k'],
  ['Hooli', 'Media', 'London', '€3.1M'],
  ['Stark & Co', 'Energy', 'Milan', '€780k'],
  ['Wayne Labs', 'Biotech', 'Zurich', '€1.9M'],
]
const CREATED = [
  ['Acme Corp', 'Retail', 'Brussels', '€410k'],
  ['Vandelay', 'Import / export', 'Amsterdam', '€690k'],
  ['Soylent', 'Food', 'Lisbon', '€320k'],
]

const Avatar = ({ label, color = ACCENT, size = 28 }: { label: string; color?: string; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: 8, background: color, color: 'white', fontSize: size * 0.42, fontWeight: 600, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
    {label.slice(0, 1)}
  </div>
)

const PALETTE = ['#2563EB', '#7C3AED', '#0D9488', '#EA580C', '#DB2777', '#4F46E5', '#65A30D', '#0891B2', '#CA8A04', '#9333EA']

function CompaniesScene({ delay, mode, created }: { delay: number; mode: 'animate' | 'static'; created: boolean }) {
  const rows = created ? [...CREATED, ...COMPANIES] : COMPANIES
  return (
    <div style={{ padding: PAD }}>
      <Enter i={0} delay={delay} mode={mode} style={{ height: TITLE_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 26, fontWeight: 600, lineHeight: '36px' }}>Companies</div>
        <div style={{ width: 150, height: 36, borderRadius: 8, background: ACCENT, color: 'white', fontSize: 14, fontWeight: 600, display: 'grid', placeItems: 'center' }}>+ New company</div>
      </Enter>
      <div style={{ background: 'white', border: `1px solid ${HERO_SHELL_TONE.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr', alignItems: 'center', height: TABLE_HEAD_H, padding: '0 20px', fontSize: 13, color: MUTED, borderBottom: `1px solid ${HERO_SHELL_TONE.line}` }}>
          <span>Name</span><span>Industry</span><span>City</span><span>ARR</span>
        </div>
        {rows.map((r, i) => (
          <Enter key={r[0]} i={i + 1} delay={delay} mode={mode} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 1fr', alignItems: 'center', height: ROW_H, padding: '0 20px', fontSize: 15, borderBottom: `1px solid ${HERO_SHELL_TONE.line}`, background: created && i < 3 ? '#EFF6FF' : undefined }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500 }}><Avatar label={r[0]} color={PALETTE[i % PALETTE.length]} />{r[0]}</span>
            <span style={{ color: MUTED }}>{r[1]}</span><span style={{ color: MUTED }}>{r[2]}</span><span>{r[3]}</span>
          </Enter>
        ))}
      </div>
    </div>
  )
}

const THREADS = [
  ['Alex Martin', 'Re: Proposal for Q4', 'Sounds good, let’s book a call on Thursday.'],
  ['Sam Lee', 'Contract review', 'Legal approved the last version, sending it over.'],
  ['Jordan Kim', 'Intro', 'Happy to connect you with our ops lead.'],
  ['Taylor Ross', 'Pricing question', 'Do you offer annual billing?'],
  ['Morgan Diaz', 'Demo follow-up', 'Thanks for the demo, the team loved it.'],
  ['Casey Wong', 'Onboarding', 'All users are set up, thanks!'],
]

function InboxScene({ delay, mode }: { delay: number; mode: 'animate' | 'static' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${INBOX_LIST_W}px 1fr`, height: '100%' }}>
      <div style={{ borderRight: `1px solid ${HERO_SHELL_TONE.line}`, background: 'white' }}>
        {THREADS.map((t, i) => (
          <Enter key={t[0]} i={i} delay={delay} mode={mode} style={{ display: 'flex', gap: 12, height: 92, alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${HERO_SHELL_TONE.line}`, background: i === 0 ? '#EFF6FF' : undefined }}>
            <Avatar label={t[0]} color={PALETTE[i]} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{t[0]}</div>
              <div style={{ fontSize: 14 }}>{t[1]}</div>
              <div style={{ fontSize: 13, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t[2]}</div>
            </div>
          </Enter>
        ))}
      </div>
      <Enter i={2} delay={delay} mode={mode} style={{ padding: 40 }}>
        <div style={{ height: 90 }}>
          <div style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px' }}>{THREADS[0][1]}</div>
          <div style={{ color: MUTED, marginTop: 8 }}>{THREADS[0][0]} · 10:42</div>
        </div>
        <div style={{ height: 220, background: 'white', border: `1px solid ${HERO_SHELL_TONE.line}`, borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.6 }}>
          Hi,<br /><br />Thanks for the detailed proposal. {THREADS[0][2]}<br /><br />Best,<br />{THREADS[0][0]}
        </div>
      </Enter>
    </div>
  )
}

function ContactScene({ delay, mode }: { delay: number; mode: 'animate' | 'static' }) {
  const fields = [['Email', 'alex@northwind.example'], ['Phone', '+33 6 00 00 00 00'], ['Company', 'Northwind'], ['Role', 'Head of Operations'], ['Owner', 'You'], ['Stage', 'Negotiation']]
  return (
    <div style={{ padding: 40, display: 'grid', gridTemplateColumns: `${CONTACT_CARD_W}px 1fr`, gap: 28, alignItems: 'start' }}>
      <Enter i={0} delay={delay} mode={mode} style={{ background: 'white', border: `1px solid ${HERO_SHELL_TONE.line}`, borderRadius: 12, padding: '24px 24px 24px' }}>
        <div style={{ height: CONTACT_HEAD_H - 24 }}>
          <Avatar label="Alex" size={64} />
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 16 }}>Alex Martin</div>
          <div style={{ color: MUTED }}>Head of Operations · Northwind</div>
        </div>
        {fields.map(([k, v], i) => (
          <Enter key={k} i={i + 1} delay={delay} mode={mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: FIELD_H, fontSize: 14, borderTop: `1px solid ${HERO_SHELL_TONE.line}` }}>
            <span style={{ color: MUTED }}>{k}</span><span>{v}</span>
          </Enter>
        ))}
      </Enter>
      <div>
        {['Call scheduled for Thursday 3pm', 'Proposal sent (v2)', 'Email opened 3 times', 'Meeting: discovery call'].map((a, i) => (
          <Enter key={a} i={i + 2} delay={delay} mode={mode} style={{ background: 'white', border: `1px solid ${HERO_SHELL_TONE.line}`, borderRadius: 12, height: 60, padding: '0 20px', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: PALETTE[i] }} />
            <span style={{ fontSize: 15 }}>{a}</span>
            <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 13 }}>{i + 1}d ago</span>
          </Enter>
        ))}
      </div>
    </div>
  )
}

const STAGES: Array<[string, string[]]> = [
  ['Lead', ['Northwind', 'Hooli', 'Soylent']],
  ['Qualified', ['Globex', 'Vandelay']],
  ['Proposal', ['Initech', 'Wayne Labs']],
  ['Won', ['Umbrella', 'Stark & Co']],
]

function PipelineScene({ delay, mode }: { delay: number; mode: 'animate' | 'static' }) {
  return (
    <div style={{ padding: PAD }}>
      <Enter i={0} delay={delay} mode={mode} style={{ height: TITLE_H }}><div style={{ fontSize: 26, fontWeight: 600, lineHeight: '36px' }}>Pipeline</div></Enter>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(4, ${COL_W}px)`, gap: COL_GAP }}>
        {STAGES.map(([stage, deals], c) => (
          <Enter key={stage} i={c + 1} delay={delay} mode={mode} style={{ background: '#EFEDEA', borderRadius: 12, padding: 12, minHeight: 600 }}>
            <div style={{ height: COL_HEAD_H, fontSize: 14, fontWeight: 600, padding: '4px 6px 0', color: MUTED }}>{stage} · {deals.length}</div>
            {deals.map((d, i) => (
              <Enter key={d} i={c + i + 2} delay={delay} mode={mode} style={{ background: 'white', borderRadius: 10, height: CARD_H, padding: '14px 14px 0', marginBottom: CARD_GAP, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}><Avatar label={d} color={PALETTE[(c * 3 + i) % PALETTE.length]} size={24} />{d}</div>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 8 }}>€{(c + 1) * 40 + i * 15}k · closes in {7 + i * 5}d</div>
              </Enter>
            ))}
          </Enter>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export interface PlatformScreenProps {
  scene: PlatformSceneKey
  /** Scripted assistant exchange. */
  assistant?: AssistantScript
  /** Forces the three rows created by the assistant (companies scene). */
  createdRows?: boolean
  /** ⌘K search open between these two frames. */
  search?: { from: number; to?: number }
  sidebarOpen?: boolean
  /** 'static' renders the final state without replaying the entrance. */
  mode?: 'animate' | 'static'
  /** Delays the scene entrance (frames). */
  entranceDelay?: number
  className?: string
  style?: CSSProperties
  /** Replaces the scene body. */
  renderScene?: () => ReactNode
}

const NAV: Array<[string, PlatformSceneKey | null]> = [['Home', null], ['Inbox', 'inbox'], ['Companies', 'companies'], ['Contacts', 'contact'], ['Pipeline', 'pipeline'], ['Reports', null]]

/** The bare 1440 x 900 canvas. Put it in <PlatformWindow> or any camera component. */
export function PlatformScreen({ scene, assistant, createdRows, search, sidebarOpen = true, mode = 'animate', entranceDelay = 0, className, style, renderScene }: PlatformScreenProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const a = useAssistant(assistant)
  const created = createdRows ?? ((assistant?.action ?? 'enrich') === 'enrich' && a.answered)
  const searchOpen = !!search && frame >= search.from && (search.to === undefined || frame < search.to)
  const searchIn = search ? spring({ frame: frame - search.from, fps, config: { stiffness: 300, damping: 28 } }) : 0
  const panelIn = assistant ? spring({ frame: frame - assistant.openAt, fps, config: { stiffness: 260, damping: 30 } }) : 0
  const panelWidth = a.open ? PANEL_WIDTH * panelIn * (1 - a.closing) : 0
  const cursorOn = Math.floor(frame / (fps * 0.5)) % 2 === 0

  let body: ReactNode
  if (renderScene) body = renderScene()
  else if (scene === 'companies') body = <CompaniesScene delay={entranceDelay} mode={mode} created={created} />
  else if (scene === 'inbox') body = <InboxScene delay={entranceDelay} mode={mode} />
  else if (scene === 'contact') body = <ContactScene delay={entranceDelay} mode={mode} />
  else body = <PipelineScene delay={entranceDelay} mode={mode} />

  return (
    <div className={className} style={{ position: 'relative', width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, overflow: 'hidden', backgroundColor: HERO_SHELL_TONE.wing, fontFamily: FONT, color: INK, display: 'flex', ...style }}>
      {sidebarOpen && (
        <div style={{ width: SIDEBAR_W, flexShrink: 0, borderRight: `1px solid ${HERO_SHELL_TONE.line}`, padding: '20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 17, padding: '0 8px 22px' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: INK }} />Acme
          </div>
          {NAV.map(([label, key]) => (
            <div key={label} style={{ padding: '9px 10px', borderRadius: 8, fontSize: 14, marginBottom: 2, background: key === scene ? '#EFEDEA' : undefined, fontWeight: key === scene ? 600 : 400, color: key === scene ? INK : MUTED }}>{label}</div>
          ))}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: TOPBAR_H, flexShrink: 0, borderBottom: `1px solid ${HERO_SHELL_TONE.line}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, boxSizing: 'border-box' }}>
          <div style={{ width: 360, height: 34, borderRadius: 8, background: HERO_SHELL_TONE.page, color: MUTED, fontSize: 13, display: 'flex', alignItems: 'center', padding: '0 12px' }}>Search… <span style={{ marginLeft: 'auto' }}>⌘K</span></div>
          <div style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: INK, color: 'white', fontSize: 13, fontWeight: 500 }}>Ask AI</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', background: HERO_SHELL_TONE.page }}>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{body}</div>
          {panelWidth > 0.5 && (
            <div style={{ width: panelWidth, flexShrink: 0, overflow: 'hidden', background: 'white', borderLeft: `1px solid ${HERO_SHELL_TONE.line}` }}>
              <div style={{ width: PANEL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Assistant</div>
                {a.sent && <div style={{ alignSelf: 'flex-end', background: ACCENT, color: 'white', borderRadius: 12, padding: '10px 14px', fontSize: 14, maxWidth: 300, marginBottom: 14 }}>{a.draft}</div>}
                {THOUGHTS.slice(0, a.answered ? 3 : a.thoughts).map((t, i) => (
                  <div key={t} style={{ fontSize: 13, color: MUTED, marginBottom: 6, opacity: a.answered || i < a.thoughts - 1 ? 0.6 : 1 }}>{a.answered || i < a.thoughts - 1 ? '✓' : '•'} {t}</div>
                ))}
                {a.answered && <div style={{ background: HERO_SHELL_TONE.page, borderRadius: 12, padding: '12px 14px', fontSize: 14, whiteSpace: 'pre-line', marginTop: 8 }}>{ANSWERS[assistant?.action ?? 'enrich']}</div>}
                <div style={{ marginTop: 'auto', border: `1px solid ${HERO_SHELL_TONE.line}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, minHeight: 48, color: a.sent || !a.draft ? MUTED : INK }}>
                  {a.sent || !a.draft ? 'Ask anything…' : <>{a.draft}{cursorOn ? '|' : ''}</>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {searchOpen && (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(17,24,39,${0.25 * searchIn})`, display: 'flex', justifyContent: 'center', paddingTop: 140 }}>
          <div style={{ width: 620, height: 340, background: 'white', borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.35)', opacity: searchIn, transform: `scale(${0.96 + 0.04 * searchIn})`, padding: 8 }}>
            <div style={{ padding: '14px 16px', fontSize: 17, borderBottom: `1px solid ${HERO_SHELL_TONE.line}` }}>North{cursorOn ? '|' : ''}</div>
            {['Northwind', 'Northwind — Q4 proposal', 'Alex Martin (Northwind)'].map((r, i) => (
              <div key={r} style={{ padding: '12px 16px', fontSize: 15, borderRadius: 8, background: i === 0 ? '#EFF6FF' : undefined, display: 'flex', alignItems: 'center', gap: 12 }}><Avatar label={r} color={PALETTE[i]} size={24} />{r}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

export interface PlatformWindowProps {
  children: ReactNode
  /** Displayed width in video px. The 1440 canvas is scaled. */
  width?: number
  /** Gradient halo behind the window. Default true ('site'), false ('clean'). */
  halo?: boolean
  radius?: number
  style?: CSSProperties
  /** 'site' = halo + drop shadow, 'clean' = 1px neutral border + soft shadow. */
  variant?: 'site' | 'clean'
  border?: boolean | string
  shadow?: string | false
  tone?: string
}

export const PLATFORM_WINDOW_BORDER = '#E2DFDD'
const SHADOW_SITE = '0 1px 2px 0 rgba(16,15,14,0.06), 0 30px 80px -30px rgba(16,15,14,0.35)'
const SHADOW_CLEAN = '0 1px 2px 0 rgba(16,15,14,0.05), 0 12px 32px -12px rgba(16,15,14,0.14), 0 40px 90px -40px rgba(16,15,14,0.18)'

/** Window frame; the scale is a computation, so it's stable frame to frame. */
export function PlatformWindow({ children, width = PLATFORM_WIDTH, halo, radius = 16, style, variant = 'site', border, shadow, tone }: PlatformWindowProps) {
  const scale = width / PLATFORM_WIDTH
  const height = PLATFORM_HEIGHT * scale
  const clean = variant === 'clean'
  const showHalo = halo ?? !clean
  const borderColor = (border ?? clean) ? (typeof border === 'string' ? border : PLATFORM_WINDOW_BORDER) : null
  const boxShadow = shadow === false ? undefined : shadow ?? (clean ? SHADOW_CLEAN : SHADOW_SITE)
  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      {showHalo && (
        <div aria-hidden style={{ position: 'absolute', inset: -5 * scale - 2, borderRadius: radius + 5, backgroundImage: 'var(--brand-ramp)', filter: `blur(${12 * Math.max(scale, 0.6)}px)`, opacity: 0.38 }} />
      )}
      <div style={{ position: 'relative', width, height, borderRadius: radius, backgroundColor: tone ?? HERO_SHELL_TONE.wing, boxShadow }}>
        {/* Explicit clip-path: under a 3D perspective Chrome doesn't always clip scaled content with border-radius + overflow alone. */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', clipPath: `inset(0 round ${radius}px)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
        {borderColor && <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: radius, border: `1px solid ${borderColor}`, pointerEvents: 'none' }} />}
      </div>
    </div>
  )
}
