---
name: Clinical Academic Portfolio
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#afcfff'
  on-tertiary: '#00315d'
  tertiary-container: '#7bb4ff'
  on-tertiary-container: '#00457e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: 0em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  space-4xl: 6rem
  gutter-desktop: 2rem
  gutter-mobile: 1rem
  container-max: 1280px
---

## Brand & Style

This design system establishes an authoritative, intellectual, and surgical aesthetic tailored for clinician-scientists, academic surgeons, and medical researchers. It merges the scholarly gravitas of high-impact medical journals with the cutting-edge precision of modern clinical biotechnology. 

The emotional tone balances institutional prestige, calm diagnostic authority, and forward-looking scientific rigor. Visually, the style pairs deep midnight architectural surfaces with high-precision frosted glass layers, surgical cyan-blue luminescent accents, and structured, high-contrast serif headlines that echo historical peer-reviewed publications.

## Colors

The palette is engineered around an immersive deep-slate and midnight-navy field, illuminated by clinical cyan and electric blue indicators:

- **Base Surfaces**: The foundational canvas rests on `#0b0f19` (Obsidian Slate), stepping up to `#111827` (Midnight Navy) for major section modules and elevated dashboard panels.
- **Card & Glass Surfaces**: Layered elements use translucent fills (`rgba(17, 24, 39, 0.7)` to `rgba(31, 41, 55, 0.45)`) backed by backdrop filters to achieve a frosted diagnostic lens effect.
- **Structural Strokes & Dividers**: Subtly delineated with `#1f2937` (Base Hairline) and `#374151` (Active/Hover Edge).
- **Clinical Accents**: 
  - Primary Accent (`#38bdf8` - Luminous Cyan): Used for key focal points, active metrics, verified credentials, and high-impact calls to action.
  - Secondary Accent (`#3b82f6` - Electric Clinical Blue): Used for interactive controls, secondary links, and authoritative progress indicators.
  - Tertiary Highlight (`#60a5fa` - Soft Sky): Reserved for subtle badges, hover glows, and clinical categorical tags.
- **Typography & Text Contrast**:
  - Headings & Citations (`#f9fafb`): Absolute pristine clarity for peer-reviewed authority.
  - Body Copy (`#d1d5db`): High-legibility neutral gray optimized for long-form abstracts, methodologies, and clinical notes.
  - Metadata & Secondary Notes (`#9ca3af`): Muted utilitarian slate for DOIs, journal volumes, timestamps, and affiliation titles.

## Typography

The typographic hierarchy presents a deliberate tension between classic academic publishing and surgical modernism:

- **Headlines (Playfair Display)**: Imparts the timeless prestige of traditional medical journals (e.g., NEJM, The Lancet). Titles are set in medium to semi-bold weights to preserve legibility against deep dark backgrounds without blooming.
- **Body & Technical Data (Inter)**: Delivers clinical neutrality, maximum legibility across quantitative clinical trials, and tabular clarity for research metrics (h-index, citation indices, trial outcomes).
- **Labels & Overlines**: Rendered in uppercase `Inter` with expanded tracking (`0.06em` to `0.08em`), functioning as clinical triage labels, grant identifiers, and medical subspecialty taxonomy markers.

## Layout & Spacing

Layout adheres to an 8-point strict mathematical rhythm, reflecting clinical discipline and structural predictability:

- **Grid Framework**: A 12-column fluid grid system bounded by a centered `1280px` maximum container width. Gutters scale from `1rem` on mobile screens to `2rem` on desktop workstations.
- **Breakpoints**:
  - `Mobile`: `< 768px` (Single column, dense reading hierarchy, unified padding of `1rem`).
  - `Tablet`: `768px - 1024px` (8-column modular layout, adaptive sidebars collapse to slide-overs).
  - `Desktop`: `> 1024px` (Full 12-column architectural balance with dedicated metadata/biographical columns).
- **Rhythm**: Component spacing relies on generous vertical breathing room (`space-2xl` to `space-4xl`) between high-level academic sections, juxtaposed against tightly grouped metadata clusters (`space-xs` to `space-sm`) inside research abstracts and clinical case studies.

## Elevation & Depth

Visual depth is achieved through layered frosted glass surfaces and subtle clinical luminescence rather than heavy drop shadows:

- **Surface Tiers**:
  - `Surface Tier 0 (Base)`: Solid `#0b0f19` canvas.
  - `Surface Tier 1 (Containers & Panels)`: Semi-translucent midnight glass (`rgba(17, 24, 39, 0.75)`) combined with a `12px` to `16px` backdrop-blur.
  - `Surface Tier 2 (Floating Modals & Flyouts)`: Translucent elevated slate (`rgba(31, 41, 55, 0.85)`) with an `18px` backdrop-blur.
- **Edge Precision**: Every elevated container features a crisp `1px` exterior border stroke in `#1f2937` paired with an ultra-fine inner hairline border (`inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`) to mimic the beveled edge of laboratory glass slides.
- **Shadow Profiles**:
  - Resting Cards: `0 8px 32px -4px rgba(0, 0, 0, 0.5)`.
  - Focused/Hovered Modules: `0 12px 40px -4px rgba(0, 0, 0, 0.65)`, accompanied by a diffuse cyan ambient halo (`0 0 20px -2px rgba(56, 189, 248, 0.15)`).

## Shapes

The design system maintains a refined, disciplined shape vocabulary with a soft `roundedness` level (level 1):

- Standard interactive controls, publication badges, and glass cards utilize a subtle `0.25rem` (`rounded`) to `0.5rem` (`rounded-lg`) corner radius. 
- Large structural portfolio containers and modal sheets cap at `0.75rem` (`rounded-xl`).
- High-level status indicators and publication type pills (e.g., "Meta-Analysis", "First Author") use an exception pill radius (`9999px`) to immediately contrast against structural content frames.

## Components

### Buttons & Interactive Triggers
- **Primary Action (e.g., "Download Curriculum Vitae", "Contact Lab")**: Solid cyan fill (`#38bdf8`) with dark slate typography (`#0b0f19`), medium weight. Hover shifts to `#60a5fa` with a targeted cyan glow.
- **Secondary Action (e.g., "View Publication", "PubMed Index")**: Frosted glass surface (`rgba(17, 24, 39, 0.6)`), `1px` stroke in `#374151`, text in `#f9fafb`. Hover elevates stroke to `#38bdf8` with an interior glow.
- **Tertiary/Ghost Action**: Transparent background, text in `#9ca3af`, transitioning to `#38bdf8` on hover with an underline indicator.

### Publication & Clinical Cards
- **Abstract & Grant Cards**: Frosted slate container (`rgba(17, 24, 39, 0.7)`), backdrop-filter blur `12px`, `1px` perimeter border `#1f2937`. Top inner edge features a high-precision `1px` subtle highlight (`rgba(255, 255, 255, 0.06)`).
- **Interactive State**: Border transitions smoothly to `#38bdf8` at 40% opacity; subtle upward translation of `-2px`.

### Badges & Status Chips
- **Research Categories & Clinical Roles**: Compact uppercase label text (`11px`), pill radius, subtle dark background (`rgba(56, 189, 248, 0.08)`), surrounded by a `1px` translucent stroke in `#38bdf8` (25% opacity), text colored in `#38bdf8`.

### Form Controls & Filter Inputs
- **Search & Cohort Filter Inputs**: Deep slate fill (`#111827`), inset border `#1f2937`, text in `#f9fafb`, placeholder in `#9ca3af`. Focus ring produces a sharp, unblurred `1px` stroke in `#38bdf8` alongside an ambient `3px` aura (`rgba(56, 189, 248, 0.2)`).
- **Checkboxes & Radios**: Squared with soft `2px` corners. Selected state filled with `#38bdf8`, featuring crisp obsidian iconography.

### Academic Lists & Timeline Modules
- **Appointments & Educational History**: Minimalist structural rows separated by `1px` borders (`#1f2937`). Date stamps and institutional affiliations occupy a dedicated fixed-width left rail in `#9ca3af`, while research roles and clinical tenure are highlighted in `#f9fafb`.