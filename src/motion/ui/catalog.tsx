/** Compositions de démonstration du module UI (dossier Studio : Catalog/UI). */
import type { ReactNode } from 'react'
import { AbsoluteFill, Composition, Folder, Img, staticFile } from 'remotion'
import { CalendarCheck, Linkedin, Sparkles, TrendingUp, UserRoundCheck } from 'lucide-react'
import { PlatformScreen } from '../../kit/Platform'
import { BRAND, BRAND_RAMP, FONT_BODY, FONT_DISPLAY, FPS } from '../tokens'
import { Camera } from '../camera/Camera'
import { centeredPlacement, platformPointToStage, platformRectToStage, PLATFORM_REGIONS as R, rectCenter } from '../camera/geometry'
import { PlacedPlatform } from '../camera/PlatformCrop'
import { Cursor } from './Cursor'
import { Callout, FocusRing, Spotlight } from './Highlight'
import { AnnotationTree } from './AnnotationTree'
import { Badge, ProgressRing } from './Indicators'
import { Keycap, ShortcutCombo } from './Keys'
import { NotificationStack } from './Notifications'

const W = 1920
const H = 1080
const PLACE = centeredPlacement(1600, W, H)
const at = (r: { x: number; y: number; w: number; h: number }) => platformRectToStage(r, PLACE)
const pt = (x: number, y: number) => platformPointToStage({ x, y }, PLACE)

/** Fond papier + lueur de marque diffuse. */
const Paper = ({ children }: { children?: ReactNode }) => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: '15%', right: '15%', top: '20%', bottom: '10%', backgroundImage: BRAND_RAMP, filter: 'blur(180px)', opacity: 0.12 }} />
    {children}
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------

/** Curseur : recherche (clic), bouton Créer (clic, main), survol d'une ligne. */
const CursorDemo = () => {
  const search = at(R.companies.search)
  const create = rectCenter(at(R.companies.createButton))
  const row = pt(260, 167)
  return (
    <Paper>
      <PlacedPlatform placement={PLACE}>
        <PlatformScreen scene="companies" search={{ from: 50, to: 78 }} />
      </PlacedPlatform>
      <Cursor
        waypoints={[
          { at: 16, x: 820, y: 760 },
          { at: 46, x: search.x + 90, y: search.y + search.h / 2, click: true },
          { at: 96, x: create.x, y: create.y, click: true, hand: true },
          { at: 134, x: row.x, y: row.y, hand: true, bend: -0.12 },
        ]}
        size={36}
      />
    </Paper>
  )
}

/** Spotlight : le voile guide l'œil de la recherche à la colonne Statut puis au bouton Créer. */
const SpotlightDemo = () => (
  <Paper>
    <PlacedPlatform placement={PLACE}>
      <PlatformScreen scene="companies" mode="static" />
    </PlacedPlatform>
    <Spotlight
      steps={[
        { at: 14, rect: at(R.companies.search), radius: 12 },
        { at: 64, rect: at({ x: 1302, y: 82, w: 138, h: 400 }), radius: 12 },
        { at: 114, rect: at(R.companies.createButton), radius: 10 },
      ]}
      until={170}
    />
    <Callout target={pt(1151, 40)} offset={{ x: -220, y: 150 }} at={24} until={60} title="Recherche ⌘K" body="Tout le CRM, en une frappe." theme="dark" />
    <Callout target={pt(1302, 280)} offset={{ x: -240, y: 40 }} at={76} until={110} title="Statuts à jour" body="Mis à jour par l’IA après chaque échange." theme="dark" />
    <Callout target={pt(1370, 74)} offset={{ x: -260, y: 170 }} at={126} until={168} title="Créer en un clic" theme="brand" badge="3" />
  </Paper>
)

/** FocusRing : l'anneau dégradé passe d'une carte à l'autre, un badge montant pop. */
const FocusRingDemo = () => {
  const heli = at(R.pipeline.cardInitech)
  const meca = at(R.pipeline.cardUmbrella)
  return (
    <Paper>
      <PlacedPlatform placement={PLACE}>
        <PlatformScreen scene="pipeline" mode="static" />
      </PlacedPlatform>
      <FocusRing steps={[{ at: 12, rect: heli, radius: 11 }, { at: 70, rect: meca, radius: 11 }]} until={140} />
      <Badge label="88 k€" variant="brand" size={22} at={30} until={70} pulse style={{ position: 'absolute', left: heli.x + heli.w - 50, top: heli.y - 22 }} />
      <Badge label="96 k€" variant="brand" size={22} at={86} until={140} pulse style={{ position: 'absolute', left: meca.x + meca.w - 50, top: meca.y - 22 }} />
    </Paper>
  )
}

/** Callouts : trois annotations sur une fiche contact, trois thèmes. */
const CalloutDemo = () => (
  <Paper>
    <PlacedPlatform placement={PLACE}>
      <PlatformScreen scene="contact" mode="static" />
    </PlacedPlatform>
    <Callout target={pt(417, 103)} offset={{ x: 210, y: -100 }} at={14} title="Score d'engagement" body="Calculé sur 12 conversations." badge="1" />
    <Callout target={pt(900, 330)} offset={{ x: 200, y: 110 }} at={46} title="Email, WhatsApp, visio" body="Toute l'histoire, dans une seule timeline." theme="brand" badge="2" />
    <Callout target={pt(355, 540)} offset={{ x: 230, y: 90 }} at={80} title="Fiche enrichie" body="Poste, entreprise, source : sans saisie." theme="dark" badge="3" />
  </Paper>
)

/** Notifications : une pile macOS s'alimente au-dessus du pipeline. */
const NotificationsDemo = () => (
  <Paper>
    <PlacedPlatform placement={PLACE}>
      <PlatformScreen scene="pipeline" mode="static" />
    </PlacedPlatform>
    <NotificationStack
      margin={60}
      items={[
        { at: 14, title: 'Nouveau deal : Ramp — 42 k€', body: 'Ajouté en Proposition par l’IA.', time: '09:41' },
        { at: 54, title: 'Camille Roux a répondu', body: '« Jeudi 14h nous arrange mieux. »', app: 'Acme · Inbox', time: '09:42', thumbnail: 'images/people/cb.jpg' },
        { at: 94, title: 'Réunion confirmée', body: 'Helioma · jeudi 14:00 – 14:30', app: 'Acme · Calendrier', time: '09:43' },
        { at: 134, title: 'Deal gagné : Novaria', body: '248 000 € · Montée en gamme', app: 'Acme · Pipeline' },
      ]}
    />
  </Paper>
)

/** ⌘K : les touches pop et s'enfoncent, la recherche s'ouvre dans l'app en synchro. */
const ShortcutDemo = () => {
  // ≥ 1440 px : sous l'échelle 1, le backdrop-blur de la recherche du site se reflète (bug Chrome).
  const place = centeredPlacement(1600, W, H)
  return (
    <Paper>
      <PlacedPlatform placement={place}>
        <PlatformScreen scene="companies" mode="static" search={{ from: 42 }} />
      </PlacedPlatform>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 70,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ padding: '26px 44px', borderRadius: 32, background: BRAND.wing, border: `1px solid ${BRAND.border}`, boxShadow: '0 2px 4px rgba(16,15,14,0.06), 0 40px 80px -30px rgba(16,15,14,0.45)' }}>
          <ShortcutCombo keys={[{ label: '⌘', sublabel: 'command' }, 'K']} at={34} size={92} caption="Cherchez n'importe quoi" />
        </div>
      </div>
    </Paper>
  )
}

/** Indicateurs : badges, compteur, anneau de progression, touche seule. */
const IndicatorsDemo = () => (
  <Paper>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 70, flexDirection: 'row' }}>
      <ProgressRing value={0.72} at={10} size={300} caption="Objectif T3" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 54, fontWeight: 500, letterSpacing: '-0.02em', color: BRAND.text }}>Pipeline T3</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Badge label="Nouveau" at={16} size={20} />
          <Badge label="Gagné" variant="success" at={22} size={20} />
          <Badge label="À relancer" variant="warning" at={28} size={20} />
          <Badge label="Churn" variant="danger" at={34} size={20} />
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: FONT_BODY, fontSize: 22, color: BRAND.textMuted }}>
          <Badge count={1284} label="contacts" variant="blue" at={40} size={20} />
          <Badge count={42} label="k€ signés" variant="dark" at={46} size={20} />
          <Badge at={52} size={20} variant="brand" pulse />
          <span>Assistant en ligne</span>
        </div>
      </div>
      <Keycap label="↵" sublabel="return" appearAt={58} pressAt={[80, 100]} size={120} widthRatio={1.4} />
    </AbsoluteFill>
  </Paper>
)

/** Visite produit : caméra + curseur + toasts, sur la vraie UI (L’IA enrichit la table). */
const ProductTourDemo = () => {
  const leoButton = pt(1411, 22)
  return (
    <Paper>
      <Camera
        platform={PLACE}
        drift={{ amplitude: 4 }}
        keyframes={[
          { at: 0, zoom: 0.94 },
          { at: 6, zoom: 1 },
          { at: 36, focus: { rect: { x: 1000, y: 0, w: 440, h: 180 }, padding: 140, maxZoom: 2.6 } },
          { at: 96, focus: { rect: { x: 1060, y: 740, w: 380, h: 160 }, padding: 170, maxZoom: 2.2 } },
          { at: 184, focus: { rect: { x: 1060, y: 40, w: 380, h: 320 }, padding: 110 } },
          // Plan large décalé à gauche : la pile de notifications respire à droite.
          { at: 256, zoom: 0.84, x: 1240, y: H / 2 },
        ]}
      >
        <PlacedPlatform placement={PLACE}>
          <PlatformScreen scene="companies" assistant={{ openAt: 80, askAt: 100, action: 'enrich' }} />
        </PlacedPlatform>
        <Cursor
          size={24}
          waypoints={[
            { at: 44, x: 1250, y: 330 },
            { at: 76, x: leoButton.x, y: leoButton.y, click: true, hand: true },
          ]}
          hideAt={100}
        />
      </Camera>
      <NotificationStack
        margin={48}
        items={[
          { at: 150, title: 'L’IA recherche des entreprises', body: 'ICP : SaaS B2B, 50 à 500 salariés.', time: '09:41' },
          { at: 300, title: '3 fiches créées par l’IA', body: 'Enrichies depuis LinkedIn et le web.', time: 'maintenant' },
        ]}
      />
    </Paper>
  )
}

/** Fond de démo (clair = papier, sombre = nuit + lueur diagonale). */
const DaBackground = ({ tone, children }: { tone: 'clair' | 'sombre'; children?: ReactNode }) => (
  <AbsoluteFill style={{ background: tone === 'clair' ? BRAND.paper : BRAND.night }}>
    <AbsoluteFill style={{ background: tone === 'clair' ? 'radial-gradient(120% 90% at 85% 10%, #FFFFFF 0%, transparent 60%)' : 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, transparent 45%, rgba(59,130,246,0.18) 100%)' }} />
    {children}
  </AbsoluteFill>
)

/** AnnotationTree (clair) : un deal du pipeline se ramifie en trois cartes dans la marge. */
const PLACE_TREE_L = { x: 64, y: (H - (1240 / 1440) * 900) / 2, width: 1240 }
const AnnotationTreeDemo = () => {
  const card = platformRectToStage(R.pipeline.cardUmbrella, PLACE_TREE_L)
  const anchor = { x: card.x + card.w - 14, y: card.y + card.h / 2 }
  const x = 1392
  return (
    <DaBackground tone="clair">
      <PlacedPlatform placement={PLACE_TREE_L}>
        <PlatformScreen scene="pipeline" mode="static" />
      </PlacedPlatform>
      <AnnotationTree
        anchor={anchor}
        at={14}
        exitAt={150}
        trunk={228}
        cardWidth={420}
        maxWidth={440}
        branches={[
          { to: { x, y: anchor.y - 132 }, icon: CalendarCheck, title: 'Réunion jeudi 14h', caption: "Planifiée par l’IA après l'email.", pill: 'Auto' },
          { to: { x, y: anchor.y }, icon: TrendingUp, title: 'Passé en Négociation', caption: 'Mecanor · probabilité 70 %', metric: '96 k€' },
          { to: { x, y: anchor.y + 132 }, icon: Sparkles, title: 'Prochaine étape', caption: 'Proposition envoyée demain, 9h.' },
        ]}
      />
    </DaBackground>
  )
}

/** AnnotationTree (sombre, courbes) : une fiche entreprise, deux cartes en verre à gauche. */
const PLACE_TREE_D = { x: 660, y: (H - (1220 / 1440) * 900) / 2, width: 1220 }
const pt2 = (x: number, y: number) => platformPointToStage({ x, y }, PLACE_TREE_D)
const AnnotationTreeDarkDemo = () => {
  // Ligne « Netora » : sous la liste de la sidebar, le tronc ne barre aucun libellé.
  const anchor = pt2(214, 525)
  const x = 470
  return (
    <DaBackground tone="sombre">
      <PlacedPlatform placement={PLACE_TREE_D}>
        <PlatformScreen scene="companies" mode="static" />
      </PlacedPlatform>
      <AnnotationTree
        anchor={anchor}
        at={14}
        exitAt={150}
        theme="dark"
        route="curve"
        fade
        trunk={250}
        cardWidth={400}
        maxWidth={420}
        branches={[
          { to: { x, y: anchor.y - 170 }, icon: Linkedin, title: 'Enrichie depuis LinkedIn', caption: '412 salariés · SaaS B2B · Paris' },
          { to: { x, y: anchor.y }, icon: UserRoundCheck, title: 'Décideur identifié', caption: 'Head of Sales, contact principal', pill: 'ICP' },
          { to: { x, y: anchor.y + 170 }, icon: TrendingUp, title: 'Score d\'intention', caption: '3 signaux cette semaine', metric: '92' },
        ]}
      />
    </DaBackground>
  )
}

export const Catalog = () => (
  <Folder name="UI">
    <Composition id="UI-Cursor" component={CursorDemo} durationInFrames={160} fps={FPS} width={W} height={H} />
    <Composition id="UI-Spotlight" component={SpotlightDemo} durationInFrames={180} fps={FPS} width={W} height={H} />
    <Composition id="UI-FocusRing" component={FocusRingDemo} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="UI-Callout" component={CalloutDemo} durationInFrames={140} fps={FPS} width={W} height={H} />
    <Composition id="UI-AnnotationTree" component={AnnotationTreeDemo} durationInFrames={180} fps={FPS} width={W} height={H} />
    <Composition id="UI-AnnotationTree-Dark" component={AnnotationTreeDarkDemo} durationInFrames={180} fps={FPS} width={W} height={H} />
    <Composition id="UI-Notifications" component={NotificationsDemo} durationInFrames={190} fps={FPS} width={W} height={H} />
    <Composition id="UI-Shortcut" component={ShortcutDemo} durationInFrames={110} fps={FPS} width={W} height={H} />
    <Composition id="UI-Indicators" component={IndicatorsDemo} durationInFrames={130} fps={FPS} width={W} height={H} />
    <Composition id="UI-ProductTour" component={ProductTourDemo} durationInFrames={380} fps={FPS} width={W} height={H} />
  </Folder>
)
