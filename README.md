# motion-design

Kit de motion design pour vidéos SaaS, sur [Remotion 4](https://www.remotion.dev).
Tout mouvement est physique (ressorts) et déterministe : chaque frame est une fonction pure de `useCurrentFrame()`.

```bash
npm install
npm run dev                       # Remotion Studio : toutes les démos sont dans le dossier « Catalog »
npx remotion render src/index.ts <Id> out/<id>.mp4               # rendu 1080p
npx remotion still src/index.ts <Id> out/x.png --frame=60 --scale=0.5
npm run render:all                # toutes les compositions du dossier « Videos »
npm run type-check
```

## Contenu

| Chemin | Rôle |
|---|---|
| `src/motion/tokens.ts` | Couleurs, dégradé, polices, formats. **Le seul endroit à changer pour appliquer ta marque.** |
| `src/motion/physics` | `SPRINGS` (smooth, snappy, bouncy, heavy, gentle, morph, jelly, critical, whip), timelines, stagger, chase/follow-through, vélocité. Jamais de stiffness/damping en dur. |
| `src/motion/primitives` | Reveal/Presence, Stagger, Float, SpringBox, Parallax, Magnet/Wobble. |
| `src/motion/text` | KineticHeadline, TextMorph, WordRotator, CountUp, TypeWriter, Scramble, Highlighter, GradientText, SplitReveal. |
| `src/motion/transitions` | Présentations `@remotion/transitions` : circleReveal, zoomThrough, blurDissolve, liquidWipe, gooeyMorph, splitPanels, flip3D, cubeRotate, slidePush, shapeMorphMask, gridTiles, brandRampSweep (`brandTransition(name, options)`). |
| `src/motion/morph` | ContainerMorph/MagicMove, CardToWindow, ShapeMorph, IconMorph, MorphBlob, LiquidButton. |
| `src/motion/camera` | Caméra (keyframes + focus sur une zone de l'écran), plans 3D, handheld, PlatformCrop, fly-out. |
| `src/motion/ui` | Cursor, ClickRipple, Spotlight/FocusRing, Callout, AnnotationTree, Notifications, Keycap. |
| `src/motion/backgrounds` | MeshGradient, Grid, Grain, Aurora, Particles, LightRays, Paper. |
| `src/motion/brand` | Logo, LogoReveal, EndCard, TitleCard, LowerThird, Watermark. |
| `src/motion/audio` | `Sfx`/`SoundCue` (rôles + thèmes sonores), `TypingSfx`, `buildVoiceTimeline`, `VoiceOverTrack`, `Captions` (karaoké au mot), `MusicBed` (ducking sous la voix). |
| `src/videos/templates` | Templates paramétriques (FeatureSpotlight, SocialTeaser, Changelog, MetricsHighlight) : schémas zod éditables dans le panneau Props du Studio. |
| `src/kit/Platform.tsx` | **Placeholder** : une fausse app SaaS « Acme » 1440×900 (4 écrans, assistant IA, ⌘K) utilisée par toutes les démos. |
| `src/shims` | `framer-motion` et `next/image` réécrits pour Remotion (alias webpack) : permet de coller tel quel un mockup React écrit pour un site Next.js. |

Chaque module déclare ses démos dans son `catalog.tsx` : c'est la référence d'usage.

## L'adapter à ton produit

1. **Marque** : `src/motion/tokens.ts` (couleurs) + `src/studio/styles.css` (`--brand-ramp`).
2. **Logo** : remplace les tracés de `src/motion/brand/logo-paths.ts` (mêmes repères) et `public/brand/*.svg`.
3. **Polices** : `src/studio/fonts.ts` (Google Fonts par défaut ; pour une police maison, `@remotion/fonts` + `public/fonts`).
4. **Écran produit** : remplace `src/kit/Platform.tsx` par ton propre mockup en gardant ses exports
   (`PlatformScreen`, `PlatformWindow`, `PLATFORM_WIDTH/HEIGHT`, `PLATFORM_REGIONS` pour la caméra).

## Voix off et SFX (ElevenLabs, optionnel)

```bash
cp .env.example .env              # puis renseigne ELEVENLABS_API_KEY
npm run voiceover -- voiceover/example.json   # génère public/voiceover/example/ (audio + timing au mot, cache par réplique)
npm run voiceover -- --voices                 # casting des voix
npm run sfx:generate              # SFX depuis sfx/prompts.json
npm run sfx:index                 # réindexe public/sfx -> src/motion/audio/sfx-registry.ts
```

Puis dans une composition : `buildVoiceTimeline(index, { fps })`, `<VoiceOverTrack>`, `<Captions>`, `<MusicBed duckUnder={vo}>`,
et cale les scènes sur `vo.at('<id de réplique>')` (voir `src/motion/audio/voiceover.tsx`).

## Règles

- Déterminisme : pas de `Math.random` (→ `random('seed')`), `Date`, `setTimeout`, transitions/animations CSS.
- La voix donne le tempo : les scènes se calent sur la voix, pas l'inverse.
- Dans une `TransitionSeries`, une présentation sortante doit être l'identité à p=0.
- Rendre les essais en `--scale=0.5`, nettoyer `out/`.

## Licences des assets

- **SFX** (`public/sfx`) : sources et licences dans `public/sfx/manifest.json`. uisfx, Kenney, Freesound (`credits.json`),
  remotion et `synth` sont **CC0**. Le dossier `elevenlabs/` a été généré sur un plan ElevenLabs payant (usage commercial).
- **Portraits** (`public/images/people`) : Unsplash, [licence Unsplash](https://unsplash.com/license) (provenance dans le README du dossier).
- **Icônes** (`public/images/icons`) : logos de marques tierces, à utiliser selon leurs chartes respectives.
- **Polices** : Inter et Inter Tight (Google Fonts, SIL Open Font License).
