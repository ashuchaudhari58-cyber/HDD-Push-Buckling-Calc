# HDD Engineering Suite --- Design Language

## 1. Design Identity

### Name

**Premium Engineering Field Intelligence**

### Core idea

The application should look like professional engineering software
designed for HDD/trenchless engineers, not a generic SaaS dashboard.

The visual language should combine:

-   industrial engineering software
-   CAE interfaces
-   construction technology
-   technical instrumentation
-   premium engineering reporting
-   cinematic but restrained visualization

The application should communicate:

**PRECISION · FORCE · GEOMETRY · LOAD · STRUCTURAL SAFETY · FIELD
ENGINEERING**

------------------------------------------------------------------------

# 2. Primary Visual Principle

The interface should feel as if a professional engineering workstation
is layered over a real HDD construction environment.

Use this hierarchy:

``` text
REAL HDD PHOTOGRAPHY
        ↓
subtle overlay
        ↓
engineering workspace
        ↓
3D installation simulation
        ↓
engineering data
```

The background should support the interface, not compete with it.

------------------------------------------------------------------------

# 3. Color System

## Primary Accent: Orange

Orange is the defining brand/accent color.

Recommended palette:

  Token          Color       Use
  -------------- ----------- -----------------------
  `accent-900`   `#9A3412`   dark orange
  `accent-800`   `#C2410C`   strong orange
  `accent-700`   `#EA580C`   active/strong accent
  `accent-600`   `#F97316`   primary accent
  `accent-500`   `#FB923C`   secondary highlight
  `accent-400`   `#FDBA74`   light accent
  `accent-100`   `#FFEDD5`   subtle highlight
  `accent-50`    `#FFF7ED`   very light background

### Primary UI usage

Use orange for:

-   primary buttons
-   active navigation
-   selected tabs
-   active inputs
-   force vectors
-   pipe highlighting
-   progress
-   chart emphasis
-   technical annotations
-   interactive controls
-   important numerical highlights
-   engineering dimensions

------------------------------------------------------------------------

# 4. No Blue Design Language

Blue should **not** be part of the application's core visual identity.

Do not use:

-   blue primary buttons
-   blue navigation
-   blue cards
-   blue charts
-   blue gradients
-   blue active states
-   blue page headers
-   blue highlights

The visual identity should be clearly distinguishable from typical blue
engineering/SaaS applications.

If an external library introduces blue defaults, override them.

------------------------------------------------------------------------

# 5. Neutral Palette

Use graphite, charcoal, steel, warm grey, white and off-white.

Suggested palette:

  Token          Color       Purpose
  -------------- ----------- --------------------
  Graphite 950   `#111111`   deep background
  Graphite 900   `#171717`   headers
  Graphite 800   `#262626`   dark UI
  Graphite 700   `#404040`   secondary text
  Steel 600      `#525252`   technical text
  Steel 400      `#A3A3A3`   borders
  Steel 300      `#D4D4D4`   dividers
  Steel 200      `#E5E5E5`   secondary surfaces
  Steel 100      `#F5F5F5`   page background
  White          `#FFFFFF`   primary panels

Prefer warm-neutral greys rather than cold blue-grey.

------------------------------------------------------------------------

# 6. Status Colors

Status colors are separate from the brand accent.

## Safe

Use a restrained green.

Example:

`#16A34A`

Symbol:

`✓`

Label:

**WITHIN LIMIT**

------------------------------------------------------------------------

## Attention

Use amber.

Example:

`#D97706`

Symbol:

`⚠`

Label:

**APPROACHING LIMIT**

------------------------------------------------------------------------

## Critical

Use red.

Example:

`#DC2626`

Symbol:

`✕`

Label:

**LIMIT EXCEEDED**

------------------------------------------------------------------------

## Important rule

Never communicate engineering status using color alone.

Always combine:

-   icon
-   text
-   color
-   optionally a numerical value

------------------------------------------------------------------------

# 7. Typography

Preferred:

**Inter**

Alternative:

**Geist**

Use:

-   medium/semibold headings
-   regular body text
-   compact labels
-   tabular numerals for calculations

Engineering values should visually align.

Example:

``` text
1,339.03 ton
3,723.9 kg/cm²
84.1 %
1.32
```

Use monospaced/tabular numerals where appropriate.

Avoid oversized marketing typography.

------------------------------------------------------------------------

# 8. Border Radius

Use restrained geometry.

Recommended:

-   buttons: 6--8 px
-   inputs: 6--8 px
-   panels: 8--12 px
-   large visualization container: 10--14 px

Avoid:

-   pill-shaped everything
-   20--30 px rounded cards
-   excessive circular UI

The interface should feel engineered.

------------------------------------------------------------------------

# 9. Shadows

Use subtle shadows.

Preferred:

``` text
0 2px 10px rgba(0,0,0,0.06)
```

For elevated panels:

``` text
0 8px 30px rgba(0,0,0,0.08)
```

Avoid dramatic floating-card shadows.

------------------------------------------------------------------------

# 10. Panels

Panels should resemble engineering software modules.

Example:

``` text
┌────────────────────────────────────────────┐
│ INSTALLATION FORCE                         │
│                                            │
│ 1,339.03 ton                               │
│ Maximum calculated installation force      │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ Axial Stress        3,723.9 kg/cm²         │
│ Utilisation         84.1 %                 │
│ Factor of Safety    1.32                   │
└────────────────────────────────────────────┘
```

Use:

-   thin borders
-   subtle shadows
-   compact spacing
-   strong hierarchy
-   orange accents

------------------------------------------------------------------------

# 11. Engineering Grid

Use subtle engineering grid patterns in visualization areas.

Example:

``` text
┼────┼────┼────┼────┼
│    │    │    │    │
├────┼────┼────┼────┼
│    │    │    │    │
┼────┼────┼────┼────┼
```

Grid opacity should be very low.

Use neutral grey lines.

Orange should be reserved for active geometry/data.

------------------------------------------------------------------------

# 12. HDD Profile Visualization

The HDD alignment should be visually dominant.

Secondary geometry:

neutral grey

Active pipe:

orange

Important dimensions:

orange

Surface:

dark neutral

Borehole:

transparent grey/brown

Example:

``` text
SURFACE
────────────────────────────────────────────

ENTRY ●
       ╲
        ╲
         ╲________________________
                                  ╲
                                   ╲ EXIT ●

        → → → PIPE MOVEMENT
```

------------------------------------------------------------------------

# 13. 3D Visualization Language

The 3D visualization should feel:

**industrial + cinematic + technical**

Not:

**game-like**

Use:

-   realistic metal
-   restrained lighting
-   subtle shadows
-   realistic soil
-   transparent borehole
-   technical overlays
-   orange force indicators

The pipe should have realistic metallic shading.

The force arrows should use orange.

------------------------------------------------------------------------

# 14. Background Photography

Use realistic HDD/construction photography.

Preferred subjects:

-   HDD rigs
-   pipeline installation
-   pipe strings
-   construction sites
-   underground pipeline work
-   trenchless construction
-   drilling operations

Images should be:

-   high resolution
-   realistic
-   industrial
-   uncluttered
-   dark enough to support UI overlays

------------------------------------------------------------------------

# 15. Background Treatment

Do not simply place a full-opacity photograph behind the UI.

Use:

``` text
IMAGE
 ↓
dark/neutral overlay
 ↓
low opacity
 ↓
optional blur
 ↓
engineering interface
```

Typical image opacity:

**8--20%**

depending on image brightness.

The background should be noticeable but never interfere with reading
calculations.

Avoid blue overlays.

Use:

-   graphite
-   black
-   warm grey
-   white
-   subtle orange lighting

------------------------------------------------------------------------

# 16. Parallax

Use restrained parallax.

Background:

very slow movement

Foreground:

normal scrolling

Visualization:

subtle depth movement

Engineering annotations:

minimal movement

The effect should communicate:

**"the application is moving over a real construction environment."**

It should not feel like a marketing website.

------------------------------------------------------------------------

# 17. Navigation

Recommended navigation:

``` text
PROJECT

PIPE & MATERIAL

MUD & SOIL

GEOMETRY

INSTALLATION

STRUCTURAL

CALCULATION

REPORT
```

Active item:

orange indicator + orange text/icon

Inactive:

neutral grey

Do not use blue active states.

------------------------------------------------------------------------

# 18. Buttons

Primary:

Orange filled

``` text
┌─────────────────────┐
│  RUN CALCULATION →  │
└─────────────────────┘
```

Secondary:

Neutral/white with border

``` text
┌─────────────────────┐
│  EXPORT REPORT      │
└─────────────────────┘
```

Danger:

Red

Do not use orange for destructive actions.

------------------------------------------------------------------------

# 19. Inputs

Inputs should look like engineering instruments.

Example:

``` text
PIPE OUTSIDE DIAMETER

┌─────────────────────────────┐
│ 36.00                 in    │
└─────────────────────────────┘
```

Focus state:

orange border/glow

Invalid:

red border

Attention:

amber border

Normal:

neutral border

------------------------------------------------------------------------

# 20. Data Visualization

Primary chart:

orange

Secondary lines:

neutral grey

Reference limits:

amber/red depending on meaning

Grid:

very light grey

Avoid rainbow charts.

Example:

``` text
Force
 ↑
 │                      ╭──────╮
 │                ╭─────╯      ╰──╮
 │       ╭────────╯                ╰──
 │───────╯
 └────────────────────────────────────→ Chainage
```

------------------------------------------------------------------------

# 21. Engineering Status Cards

Preferred:

``` text
┌───────────────────────────────────────┐
│ STRUCTURAL ASSESSMENT                 │
│                                       │
│ ✓ AXIAL STRENGTH                     │
│   WITHIN EVALUATED LIMIT             │
│                                       │
│ ⚠ BUCKLING                           │
│   LIMIT EXCEEDED                      │
│                                       │
│ GOVERNING CONDITION                  │
│ HELICAL BUCKLING                     │
└───────────────────────────────────────┘
```

Use:

-   orange for section headings
-   green for safe
-   amber for warning
-   red for critical
-   graphite for supporting information

------------------------------------------------------------------------

# 22. Data Density

This is an engineering application.

Do not over-minimize the information.

A professional engineer should be able to see meaningful technical
information without opening ten different dialogs.

Use:

-   compact tables
-   expandable calculation sections
-   tooltips
-   hover information
-   summary cards

Balance density with whitespace.

------------------------------------------------------------------------

# 23. Tables

Tables should be highly legible.

Header:

graphite/neutral

Active/highlight:

orange

Critical:

light red

Warning:

light amber

Safe:

light green

Use thin borders.

Avoid excessive rounded table rows.

------------------------------------------------------------------------

# 24. Icons

Use a consistent line-icon system.

Recommended:

**Lucide Icons**

Use icons for:

-   pipe
-   project
-   geometry
-   soil
-   force
-   structural analysis
-   report
-   settings
-   play
-   pause
-   warning
-   critical status

Do not mix many icon styles.

------------------------------------------------------------------------

# 25. Animation Language

Animation should feel:

**mechanical**

rather than:

**decorative**

Good:

-   pipe movement
-   force arrows
-   progressive installation
-   subtle number transitions
-   graph synchronization
-   panel transitions
-   engineering indicators

Avoid:

-   bouncing
-   excessive scaling
-   confetti
-   flashy particle effects
-   unnecessary gradients
-   marketing-style hero animations

------------------------------------------------------------------------

# 26. Force Visualization

Force is one of the main concepts of the application.

Use orange to represent:

**ACTIVE INSTALLATION FORCE**

Example:

``` text
RIG →→→→→→→→ PIPE
       → → → → →
```

As the force increases:

-   vector density can increase
-   vector length can increase
-   numerical emphasis increases

Do not use visual effects to imply physical phenomena that are not
calculated.

------------------------------------------------------------------------

# 27. Buckling Visualization

Normal:

``` text
────────────────────────
```

Buckling:

``` text
──────~~~~──~~~~──~~~~──
```

Visual deformation should be exaggerated.

Always label:

**Visual deformation exaggerated for clarity; not to scale.**

------------------------------------------------------------------------

# 28. Engineering HUD

The HUD should resemble field instrumentation.

Example:

``` text
┌──────────────────────────────┐
│ LIVE INSTALLATION            │
│                              │
│ PROGRESS          63.2 %     │
│ CHAINAGE        1,621 m      │
│ FORCE             987 ton    │
│ AXIAL STRESS  2,841 kg/cm²  │
│ UTILISATION       64.3 %    │
│                              │
│ ✓ WITHIN LIMIT               │
└──────────────────────────────┘
```

Orange should highlight the active numerical state.

------------------------------------------------------------------------

# 29. Engineering Annotation Style

Use technical annotation lines:

``` text
                 R = 750 m
                    ↓
              ╭─────────╮
             ╱           ╲
────────────╯             ╰────────────
```

Use orange for active measurements.

Use neutral grey for secondary construction lines.

------------------------------------------------------------------------

# 30. Visual Hierarchy

The page should follow this hierarchy:

### Level 1

Engineering result

### Level 2

Installation visualization

### Level 3

Structural status

### Level 4

Force/chainage analysis

### Level 5

Calculation breakdown

### Level 6

Inputs and metadata

Do not allow decorative background imagery to overpower Level 1--3
content.

------------------------------------------------------------------------

# 31. Overall Mood

The final application should feel:

-   industrial
-   precise
-   technical
-   modern
-   premium
-   trustworthy
-   field-oriented
-   engineering-driven

Visual keywords:

**STEEL** **FORCE** **EARTH** **PIPE** **MOTION** **PRECISION**
**ORANGE** **GRAPHITE**

------------------------------------------------------------------------

# 32. What to Avoid

Do not use:

-   blue SaaS themes
-   purple gradients
-   neon gradients
-   excessive glassmorphism
-   giant rounded cards
-   excessive white space
-   cartoonish illustrations
-   generic stock dashboard graphics
-   excessive animations
-   unnecessary 3D effects
-   decorative UI that does not communicate engineering information

------------------------------------------------------------------------

# 33. Design System Summary

``` text
BRAND ACCENT
Orange

BASE
Graphite / Steel / Warm Grey / White

STATUS
Green / Amber / Red

PRIMARY FONT
Inter / Geist

ICON SYSTEM
Lucide

BORDER RADIUS
6–14 px

SHADOW
Subtle

VISUALIZATION
Three.js / React Three Fiber

BACKGROUND
Real HDD photography, low opacity

ACTIVE GEOMETRY
Orange

FORCE
Orange

SECONDARY GEOMETRY
Neutral grey

CRITICAL
Red

WARNING
Amber

SAFE
Green

BLUE
Do not use as a design-system color
```

------------------------------------------------------------------------

# 34. Design Goal

The final interface should look like a product that could plausibly be
used by:

-   HDD contractors
-   trenchless engineering consultants
-   pipeline designers
-   mechanical engineers
-   construction engineers
-   engineering review teams

It should feel appropriate for both:

**engineering analysis**

and

**client-facing technical presentation**.

The goal is not merely to make the interface prettier.

The goal is to make the engineering information **faster to understand,
easier to audit, and more visually connected to the physical HDD
installation process.**
