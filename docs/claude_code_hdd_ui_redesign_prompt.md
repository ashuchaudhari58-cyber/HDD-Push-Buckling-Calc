# Claude Code Prompt --- HDD Push / Pull Force & Buckling Calculator UI/UX Redesign

You are modifying an existing HDD engineering web application called:

**"HDD Push / Pull Force & Buckling Calculator"**

The application calculates HDD installation force, pipe axial stress and
buckling capacity for trenchless pipeline installation.

IMPORTANT: Do **not** rebuild the calculation engine from scratch. Do
**not** alter engineering formulas, calculation logic, input/output
relationships, or existing validated results unless explicitly
instructed.

The primary objective of this task is to substantially improve the
UX/UI, visualization, engineering presentation, responsiveness, and
professional appearance while preserving the existing calculation
engine.

------------------------------------------------------------------------

## 1. FIRST: AUDIT THE EXISTING APPLICATION

Before making changes:

1.  Inspect the entire existing codebase.
2.  Identify:
    -   framework
    -   component structure
    -   styling system
    -   calculation modules
    -   state management
    -   existing charts
    -   report generation
    -   routing
    -   asset structure
    -   existing SVG/canvas/3D elements
3.  Determine whether the project is React, Next.js, Vite, or another
    framework.
4.  Reuse the existing architecture wherever practical.
5.  Do not introduce unnecessary dependencies.
6.  Before changing calculation logic, document exactly where the
    calculation engine is located.
7.  Preserve all current numerical outputs.

Create a short internal implementation plan before modifying the code.

------------------------------------------------------------------------

## 2. NEW DESIGN LANGUAGE

Redesign the application using the following design language:

**"PREMIUM ENGINEERING FIELD INTELLIGENCE"**

The application should feel like professional engineering software
rather than a generic SaaS dashboard.

Design inspiration:

-   modern CAE software
-   Bentley engineering applications
-   Hexagon/Leica engineering interfaces
-   Siemens engineering software
-   industrial instrumentation dashboards
-   modern technical control rooms

Avoid:

-   generic Bootstrap dashboard appearance
-   excessive rounded cards
-   excessive glassmorphism
-   excessive gradients
-   cryptocurrency-style dashboards
-   overly playful SaaS styling
-   giant decorative typography
-   excessive animation unrelated to engineering

The visual hierarchy must prioritize:

1.  Engineering result
2.  Installation visualization
3.  Safety/structural status
4.  Calculation breakdown
5.  Inputs
6.  Secondary metadata

------------------------------------------------------------------------

## 3. COLOR SYSTEM

Use a restrained **orange + neutral industrial engineering palette**.

### Primary accent

**Orange must be the main accent color throughout the application.**

Orange should be used for:

-   primary actions
-   active navigation states
-   important engineering highlights
-   force/load indicators
-   progress indicators
-   selected chart elements
-   interactive controls
-   key annotations
-   technical highlights

Recommended orange family:

-   Primary orange: `#F97316`
-   Dark orange: `#EA580C`
-   Light orange: `#FDBA74`
-   Very light orange: `#FFF7ED`

### Important restriction

**Do not use blue as the primary, secondary, or accent UI color.**

Do not use the typical blue SaaS/engineering dashboard palette.

Avoid:

-   blue buttons
-   blue active navigation
-   blue cards
-   blue gradients
-   blue highlights
-   blue progress bars
-   blue primary charts

The application may use neutral colors and status colors, but blue
should not form part of the core brand/design system.

### Neutral engineering palette

Use:

-   graphite
-   charcoal
-   slate
-   steel grey
-   warm grey
-   white
-   off-white

Suggested visual direction:

-   dark graphite for headers and technical labels
-   white/off-white for primary surfaces
-   light grey for secondary surfaces
-   dark charcoal for text
-   orange for interaction and engineering emphasis

### Status colors

GREEN: Safe / within limits

AMBER: Approaching limit / attention

RED: Limit exceeded / critical

NEUTRAL: Steel grey / light grey

Do not use color as the only indicator.

Every status should include:

-   icon
-   text
-   color

For example:

✓ WITHIN LIMIT

⚠ APPROACHING LIMIT

✕ LIMIT EXCEEDED

------------------------------------------------------------------------

## 4. TYPOGRAPHY

Use a professional UI font such as:

**Inter**

or

**Geist**

Use tabular/monospaced numerals where useful for engineering values.

Engineering numbers must visually align.

Examples:

-   1,339.03 ton
-   3,723.9 kg/cm²
-   84.1 %
-   1.32

Avoid overly large body text.

------------------------------------------------------------------------

## 5. APPLICATION STRUCTURE

Transform the application into an engineering workspace.

Suggested primary navigation:

-   PROJECT
-   PIPE & MATERIAL
-   MUD & SOIL
-   GEOMETRY
-   INSTALLATION
-   STRUCTURAL
-   CALCULATION
-   REPORT

Desktop layout:

LEFT: Collapsible engineering navigation/input panel

CENTER: Primary engineering visualization

RIGHT: Result/status/engineering assessment panel where appropriate

On smaller screens: collapse navigation into a drawer.

------------------------------------------------------------------------

## 6. PROJECT HEADER

Create a professional application header.

Show:

**HDD ENGINEERING SUITE**

HDD Push / Pull Force & Buckling Calculator

Project name

Project number / drawing number

Revision

Date

Actions:

-   Save Project
-   Export Report
-   Reset
-   Settings

Do not overcrowd the header.

The header should use graphite/neutral tones with orange as the
active/action accent.

------------------------------------------------------------------------

## 7. REDESIGN INPUT PANELS

Replace the current basic browser number-input appearance.

Inputs should look like engineering controls.

Example:

PIPE OUTSIDE DIAMETER

``` text
┌─────────────────────────────┐
│ 36.00                 in    │
└─────────────────────────────┘
```

Support:

-   direct numerical entry
-   unit display
-   validation
-   tooltip
-   sensible min/max validation
-   invalid input highlighting

Where appropriate, add a compact range indicator.

Do NOT make sliders mandatory for precision inputs.

Retain keyboard accessibility.

------------------------------------------------------------------------

## 8. INPUT VALIDATION

Add an engineering input validation layer.

Examples:

-   wall thickness cannot be negative
-   pipe OD must be greater than wall thickness × 2
-   friction coefficient must be physically reasonable
-   density values must be positive
-   entry/exit angles must be validated
-   radius must be positive

Do not arbitrarily restrict legitimate engineering values.

When an input is invalid:

Show:

**⚠ INPUT REQUIRES ATTENTION**

with a concise explanation.

Use orange for attention states where appropriate, while retaining
amber/red for actual engineering warning/critical states.

------------------------------------------------------------------------

## 9. PROJECT COMPLETENESS INDICATOR

Add an "Analysis Readiness" indicator.

Example:

``` text
ANALYSIS STATUS

✓ Project information
✓ Pipe properties
✓ Soil properties
✓ Geometry
✓ Installation parameters

● READY TO CALCULATE
```

If incomplete:

``` text
⚠ 2 INPUTS REQUIRE ATTENTION
```

Clicking the warning should take the user directly to the missing
fields.

Use orange as the primary UI highlight for the active/readiness
interaction.

------------------------------------------------------------------------

## 10. HERO INSTALLATION VISUALIZATION

Create a major visualization called:

**INSTALLATION SIMULATION**

This must become the visual centerpiece of the application.

The visualization should represent:

-   HDD rig
-   ground surface
-   underground soil
-   borehole
-   HDD pipe
-   entry point
-   exit point
-   curved sections
-   tangent sections
-   pipe movement direction
-   force direction
-   installation progress

The visualization must update from the actual calculation inputs.

------------------------------------------------------------------------

## 11. HYPER-REALISTIC HDD PUSHING ANIMATION

Create a browser-based 3D engineering visualization.

Preferred technology if compatible with the existing stack:

-   Three.js
-   React Three Fiber
-   @react-three/drei
-   GSAP / Framer Motion where appropriate

Do not use a heavy game-engine architecture.

The animation should represent **PIPE PUSHING / INSTALLATION**.

Important: This application is specifically analyzing installation by
pushing.

Do not automatically portray a conventional pullback operation.

The pipe should visibly advance through the prepared borehole from the
installation/rig side.

Animation sequence:

1.  HDD rig idle
2.  Hydraulic thrust system engages
3.  Pipe begins moving
4.  Pipe advances through straight section
5.  Pipe follows the curved section
6.  Pipe progresses through horizontal section
7.  Pipe approaches exit
8.  Final installed position

Add a Play button.

Controls:

-   PLAY
-   PAUSE
-   RESTART
-   0.25x
-   0.5x
-   1x
-   2x

Also add:

**AUTO PLAY**

------------------------------------------------------------------------

## 12.1 REALISTIC PIPE MOVEMENT

The pipe must not simply translate linearly.

Its centerline should follow the actual calculated HDD alignment.

Create the pipe using:

-   TubeGeometry
-   procedural spline
-   Catmull-Rom spline or equivalent

The pipe geometry should be generated from the calculated profile.

When the input:

-   entry angle
-   exit angle
-   radius
-   crossing length

changes, the pipe geometry must update.

------------------------------------------------------------------------

## 12.2 BOREHOLE

Create a translucent borehole around the pipe.

Use:

-   semi-transparent material
-   realistic soil/tunnel shading
-   subtle volumetric depth

The pipe should visibly move inside the borehole.

Use restrained orange technical markings to indicate the active
pipe/force direction.

------------------------------------------------------------------------

## 12.3 SOIL

Represent the subsurface using layered engineering visualization.

Possible layers:

-   Topsoil
-   Soft soil
-   Clay
-   Sand
-   Rock

If the current application only has generalized soil inputs, do not
invent geological layers.

Instead use:

**SOIL / BOREHOLE**

and visually communicate that the pipe is underground.

------------------------------------------------------------------------

## 12.4 FORCE VISUALIZATION

Show force vectors along the pipe.

Use animated arrows:

`→ → → → →`

The arrow intensity/density should correspond to the calculated
installation force.

Use orange as the primary force-vector visualization color.

Add a live HUD:

``` text
INSTALLATION FORCE

1,339.03 ton

CHAINAGE

1,842 m

PROGRESS

68.2 %

AXIAL STRESS

3,723.9 kg/cm²

STRUCTURAL STATUS

CRITICAL
```

These values must come from the actual calculation state.

------------------------------------------------------------------------

## 12.5 BUCKLING VISUALIZATION

If buckling is detected:

visually exaggerate the pipe deformation slightly for clarity.

Example:

Normal:

`────────────────────────`

Buckling:

`──────~~~~──~~~~──~~~~──`

IMPORTANT:

This is a visualization only.

Add a small label:

**"Visual deformation exaggerated for clarity; not to scale."**

Never present the animation as FEA deformation.

------------------------------------------------------------------------

## 12.6 REALISTIC MATERIALS

Use realistic but performant materials.

Pipe: dark metallic steel

Borehole: translucent muddy/soil appearance

Soil: subtle procedural texture

Rig: industrial construction-equipment appearance

Use restrained orange details on the rig, force indicators, controls, or
safety markings where visually appropriate.

Do not make the scene photorealistic at the expense of performance.

The target is:

**"engineering visualization with cinematic realism"**

not a video game.

------------------------------------------------------------------------

## 13. BACKGROUND PHOTOGRAPHY SYSTEM

Add large high-quality HDD construction photographs as page backgrounds.

The background should include imagery such as:

-   HDD rig
-   pipe installation
-   trenchless construction
-   underground pipeline construction
-   construction site
-   HDD pipe string

Use properly licensed / locally hosted assets.

Do not hotlink random external images in production.

The background image must be very subtle.

Recommended treatment:

background image + neutral/graphite or warm light overlay + low
opacity + optional blur + foreground engineering panels

The user should perceive the construction image without sacrificing
readability.

Do not use blue overlays.

Prefer:

-   graphite overlays
-   warm grey overlays
-   neutral white overlays
-   subtle orange light accents

------------------------------------------------------------------------

## 14. SCROLLING / PARALLAX EFFECT

Implement the following visual hierarchy:

BACKGROUND: fixed or very slow parallax movement

FOREGROUND: normal page scrolling

ENGINEERING PANELS: subtle depth/parallax

The result should feel like:

**"the engineering application is sliding over a real HDD construction
site."**

Do not make the parallax excessive.

Respect:

`prefers-reduced-motion`

for accessibility.

------------------------------------------------------------------------

## 15. SECTION-SPECIFIC BACKGROUNDS

Where practical, use different background imagery for major sections.

PROJECT: HDD construction site

GEOMETRY: underground pipeline/profile imagery

INSTALLATION: HDD rig / pipe installation

STRUCTURAL: steel pipeline / engineering imagery

REPORT: clean engineering/document background

Keep opacity low.

The application must remain readable.

Do not use blue as a section theme.

------------------------------------------------------------------------

## 16. INSTALLATION FORCE DASHBOARD

Replace the current basic top result banner.

Create a premium engineering result panel:

``` text
INSTALLATION FORCE

1,339.03 ton

Maximum calculated installation force
```

Then display:

Axial Stress 3,723.9 kg/cm²

Allowable Stress 4,429.3 kg/cm²

Utilisation 84.1 %

Factor of Safety 1.32

Buckling Capacity 18.26 ton

Add a force utilization gauge.

Use the existing engineering criteria where available.

The gauge should use:

-   neutral/green for acceptable range
-   amber for attention
-   red for exceeded range
-   orange as the primary interface accent

Do not hard-code thresholds if the engineering model already has defined
criteria.

------------------------------------------------------------------------

## 17. ENGINEERING STATUS PANEL

Replace the current large generic red box with a professional assessment
panel.

Example:

``` text
STRUCTURAL ASSESSMENT

● AXIAL STRENGTH
WITHIN EVALUATED LIMIT

⚠ BUCKLING
LIMIT EXCEEDED

GOVERNING CONDITION

Helical buckling

Installation force
1,339.03 ton

Evaluated capacity
18.26 ton

Review required
```

Use orange for headings and active elements, while retaining red for
genuinely critical/failed engineering states.

Do not automatically make engineering decisions beyond what the
calculation model establishes.

------------------------------------------------------------------------

## 18. FORCE VS CHAINAGE GRAPH

Add an interactive chart:

**INSTALLATION FORCE vs CHAINAGE**

X axis: Chainage / Distance

Y axis: Installation Force

The graph must show:

-   calculated force
-   maximum force
-   critical regions
-   segment transitions

Use orange as the primary plotted line/highlight.

Hover should show:

-   Chainage
-   Force
-   Section
-   Friction
-   Relevant calculation parameters

IMPORTANT:

Synchronize graph and 3D animation.

If the user moves the cursor along the graph:

the 3D pipe visualization should move to the corresponding chainage.

------------------------------------------------------------------------

## 19. SEGMENT-BY-SEGMENT CALCULATION

Add:

**CALCULATION TRACE**

Example:

``` text
SEGMENT 01
Entry tangent
Length: XXX m
Force contribution: XXX ton

SEGMENT 02
Entry curve
Length: XXX m
Force contribution: XXX ton

SEGMENT 03
Horizontal tangent
Length: XXX m
Force contribution: XXX ton

SEGMENT 04
Exit curve
Length: XXX m
Force contribution: XXX ton

Final installation force:
1,339.03 ton
```

Make every segment expandable.

Do not alter the underlying formulas.

------------------------------------------------------------------------

## 20. INTERACTIVE HDD PROFILE

Create an engineering profile visualization.

Show:

-   ENTRY
-   EXIT
-   SURFACE
-   BORE PATH
-   PIPE
-   TANGENT
-   CURVE
-   RADIUS
-   DEPTH

Display dimensions.

The profile should dynamically update when:

-   entry angle changes
-   exit angle changes
-   radius changes
-   total length changes

Use orange for the active pipe alignment and engineering dimensions,
with neutral lines for secondary geometry.

Where safe and appropriate, allow interactive profile manipulation.

If profile dragging is implemented:

**DO NOT silently change values.**

Update the corresponding input values explicitly.

------------------------------------------------------------------------

## 21. ENGINEERING HUD

During simulation show a floating HUD:

``` text
LIVE INSTALLATION

Progress
63.2 %

Chainage
1,621 m

Force
987 ton

Axial stress
2,841 kg/cm²

Utilisation
64.3 %

Status
WITHIN LIMIT
```

Keep this visually compact.

Use orange for active values/indicators and status-specific colors for
actual engineering status.

------------------------------------------------------------------------

## 22. ASSUMPTIONS AND REFERENCES

Add an expandable section:

**CALCULATION BASIS**

Show:

-   formula categories
-   assumptions
-   governing criteria
-   units
-   material basis
-   soil basis

Add:

**REFERENCES**

The application must clearly distinguish:

CALCULATED RESULT

ASSUMPTION

ENGINEERING GUIDANCE

Do not present general guidance as a calculated result.

------------------------------------------------------------------------

## 23. REPORT GENERATION

Upgrade the existing report.

Report should contain:

1.  Cover page
2.  Project information
3.  Revision information
4.  Design inputs
5.  Pipe properties
6.  Mud/soil properties
7.  HDD geometry
8.  Installation force calculation
9.  Force vs chainage chart
10. Installation profile
11. Axial stress assessment
12. Buckling assessment
13. Engineering status
14. Assumptions
15. References
16. Notes
17. Revision history

Use a professional engineering-document layout.

The report should use the same orange/graphite visual identity.

------------------------------------------------------------------------

## 24. PROJECT MANAGEMENT FEATURES

Add:

SAVE PROJECT

LOAD PROJECT

DUPLICATE PROJECT

RESET PROJECT

EXPORT REPORT

PROJECT REVISION

Example:

Project: HDD Crossing --- Imampur Ghat

Revision: 00

Date: 26 Sep 2026

Prepared by: \_\_\_\_\_\_\_\_

Checked by: \_\_\_\_\_\_\_\_

------------------------------------------------------------------------

## 25. UNIT SYSTEM

Add a global unit selector.

Possible systems:

-   SI
-   Metric Engineering
-   US Customary

The current calculation engine may internally use existing units.

Do not break the existing calculation system.

Only convert values at the UI boundary if appropriate.

------------------------------------------------------------------------

## 26. RESPONSIVE DESIGN

Desktop: full engineering workspace

Tablet: collapsible sidebar

Mobile: stacked layout

The 3D visualization should remain usable on mobile.

However, do not compromise the desktop engineering experience merely to
optimize mobile.

------------------------------------------------------------------------

## 27. PERFORMANCE

This is critical.

The application may contain:

-   3D graphics
-   charts
-   animations
-   photographs
-   calculations

Optimize using:

-   lazy loading
-   compressed images
-   WebP/AVIF where appropriate
-   efficient Three.js rendering
-   instancing where appropriate
-   avoid unnecessary re-renders
-   requestAnimationFrame only where needed
-   pause animation when tab is inactive
-   dispose Three.js resources properly

Target smooth performance on a normal engineering laptop.

------------------------------------------------------------------------

## 28. ACCESSIBILITY

Support:

-   keyboard navigation
-   readable contrast
-   visible focus states
-   tooltips
-   aria labels
-   reduced motion

Do not make the UI dependent on color alone.

------------------------------------------------------------------------

## 29. MICROINTERACTIONS

Add subtle professional interactions:

-   panel transitions
-   number transitions
-   status changes
-   hover states
-   chart interaction
-   simulation progress
-   section expansion
-   tooltip appearance

Avoid:

-   bouncing buttons
-   excessive particle effects
-   flashy transitions
-   unnecessary animations

Everything should feel mechanical/engineering-oriented.

Use orange for purposeful interaction feedback rather than decorative
animation.

------------------------------------------------------------------------

## 30. ENGINEERING VISUALIZATION STYLE

The visual language should communicate:

PRECISION LOAD FORCE GEOMETRY STRUCTURAL SAFETY FIELD ENGINEERING

Use:

-   thin technical lines
-   measurement markers
-   engineering grid
-   subtle coordinates
-   chainage indicators
-   force arrows
-   section labels
-   technical annotations

Use orange for:

-   active pipe
-   force vectors
-   dimension highlights
-   selected geometry
-   important engineering annotations
-   interactive states

Use neutral tones for secondary geometry and background information.

This should resemble professional engineering visualization software.

------------------------------------------------------------------------

## 31. TOP-LEVEL PAGE STRUCTURE

Target structure:

HEADER

↓

PROJECT OVERVIEW

↓

INSTALLATION SIMULATION 3D visualization Live force Progress Chainage

↓

ENGINEERING SUMMARY

    Installation Force
    Axial Stress
    Utilisation
    Buckling Capacity
    Safety Status

↓

HDD PROFILE

↓

FORCE vs CHAINAGE

↓

CALCULATION TRACE

↓

STRUCTURAL ASSESSMENT

↓

ASSUMPTIONS & REFERENCES

↓

REPORT / REVISION

------------------------------------------------------------------------

## 32. IMPORTANT DATA INTEGRITY RULE

This is an engineering application.

NEVER change a calculation merely to make the UI look better.

NEVER fabricate values.

NEVER approximate displayed values if the calculation engine provides
the actual value.

NEVER use fake animation data for engineering results.

If the 3D visualization needs simplified visual values:

clearly separate:

CALCULATED VALUE

from

VISUALIZATION SCALE

Example:

Calculated force: 1,339.03 ton

Visualization: Force vector scaled ×0.01 for visibility

------------------------------------------------------------------------

## 33. IMPORTANT SAFETY / ENGINEERING DISCLAIMER

Include a compact disclaimer in the report and appropriate UI location:

"Engineering results are dependent on the input data, assumptions,
calculation methodology and applicable project criteria. The software
does not replace project-specific engineering review."

Do not make the disclaimer intrusive.

------------------------------------------------------------------------

## 34. FINAL QUALITY BAR

The finished application should look like a commercial engineering
product.

A user should be able to look at the application and immediately
understand:

1.  What project is being analyzed?
2.  What pipe is being installed?
3.  What is the installation force?
4.  Where is the pipe along the HDD profile?
5.  What is the governing structural condition?
6.  Is the calculated condition within the evaluated criterion?
7.  Why did the calculation produce that result?
8.  What assumptions were used?

The application should feel:

**PRECISE** **TECHNICAL** **PREMIUM** **INDUSTRIAL**
**ENGINEERING-FOCUSED**

with a distinctive **orange + graphite industrial identity**.

NOT:

**GENERIC** **PLAYFUL** **AI-SaaS-LIKE** **OVERDECORATED**

Do not introduce a blue-based design language.

------------------------------------------------------------------------

## 35. IMPLEMENTATION STRATEGY

Do this in phases.

### PHASE 1

Audit codebase and calculation architecture.

### PHASE 2

Implement design system and new layout.

### PHASE 3

Redesign input panels.

### PHASE 4

Implement engineering summary/dashboard.

### PHASE 5

Implement dynamic HDD profile.

### PHASE 6

Implement force-vs-chainage visualization.

### PHASE 7

Implement Three.js installation simulation.

### PHASE 8

Implement realistic background/parallax system.

### PHASE 9

Implement calculation trace.

### PHASE 10

Upgrade report generation.

### PHASE 11

Responsive/accessibility/performance optimization.

After each phase:

-   run the application
-   check console errors
-   verify calculations remain unchanged
-   verify responsive behavior
-   verify no broken components

------------------------------------------------------------------------

## 36. FINAL ACCEPTANCE CRITERIA

The implementation is successful only if:

✓ Existing calculations still produce identical values.

✓ Existing project inputs still work.

✓ Installation force remains numerically identical.

✓ Axial stress remains numerically identical.

✓ Buckling calculations remain numerically identical.

✓ HDD profile responds to input changes.

✓ 3D pipe follows the calculated HDD alignment.

✓ Pipe visibly moves through the borehole during simulation.

✓ Force values update from real calculation data.

✓ Force-vs-chainage chart uses real calculation data.

✓ Structural status uses actual calculated criteria.

✓ Background images are subtle and readable.

✓ Page scrolling creates a restrained parallax/depth effect.

✓ UI works on desktop and tablet.

✓ No unnecessary dependencies are introduced.

✓ No console errors.

✓ No placeholder lorem ipsum.

✓ No fake engineering values.

✓ No visual element claims to represent actual FEA deformation.

✓ Orange is the dominant UI accent.

✓ Blue is not used as the primary/secondary/accent design color.

✓ The result looks like a professional HDD engineering application.

After implementation, provide a concise summary of:

-   files changed
-   new dependencies
-   UI changes
-   visualization changes
-   calculation changes (should be NONE unless explicitly required)
-   performance considerations
-   remaining limitations
