# Design Document: UI/UX Refactor for "Stewthius Over Time"

## 1. Project Overview

**Current State:** The application tracks data for a legendary perpetual stew with a warm, thematic "communal kitchen" UI.

**Design Philosophy:** "Rustic Analytics." Data is the star, but it's presented on a well-loved recipe card rather than a corporate spreadsheet.

---

## 2. Visual Design System

### A. Color Palette — "The Savory Palette"

| Token | Name | Value | Usage |
|---|---|---|---|
| `--background` | Parchment | `#FDFBF7` | Page background, mimics recipe paper |
| `--foreground` | Cast Iron | `#2D2A26` | Primary text, softer than pure black |
| `--primary` | Broth Amber | `#D9772F` | Primary buttons, active states, highlights |
| `--chart-2` / `herb-green` | Herb Green | `#4A7C59` | Positive sentiment, impact values |
| `--destructive` / `burnt-tomato` | Burnt Tomato | `#BC4749` | Negative sentiment, destructive actions |
| `--card` | Cream | `#FAF7F2` | Card backgrounds |
| `--chart-4` | Warm Amber | `#C9943E` | Neutral sentiment |
| `--chart-5` | Plum | `#7B5EA7` | Experimental sentiment |

**Dark mode** uses warm, desaturated counterparts of all colors.

### B. Typography

| Role | Font | Weight Range | Usage |
|---|---|---|---|
| Display / Headers | **Fraunces** (serif) | 400–700 | Card titles, section headers, stats |
| Body / Data | **Manrope** (sans-serif) | 400–600 | Body text, tables, descriptions |
| Code / Mono | **JetBrains Mono** | 400 | Monospace contexts |

Fraunces gives the site an editorial, cookbook-like feel. Manrope keeps data highly legible.

### C. Shadows

All shadows use a warm amber tint (`rgba(217, 119, 47, opacity)`) instead of pure black:

| Token | Value |
|---|---|
| `shadow-warm` | `0 4px 12px rgba(217, 119, 47, 0.08)` |
| `shadow-warm-lg` | `0 8px 24px rgba(217, 119, 47, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04)` |

### D. Border Radius

Base radius is `0.625rem` (10px). Cards use `rounded-xl` (12px).

---

## 3. Component Styling

### Cards & Containers

- **Recipe Card aesthetic**: `rounded-xl`, warm `shadow-warm` drop shadow
- **Semi-transparent**: `bg-card/80 backdrop-blur-sm border-border/50`
- Card titles use `font-serif` (Fraunces) for personality

### Data Visualizations (Bar Chart)

- Sentiment colors: Herb Green (positive), Plum (experimental), Warm Amber (neutral), Burnt Tomato (negative)
- Bar top corners rounded to `radius={[6, 6, 0, 0]}` for softer feel
- Tooltips styled with warm shadow and cream background

### Header

- Full-width gradient banner using `bg-gradient-primary`
- Subtle SVG steam motif (low-opacity wavy lines) behind content
- Dynamic subtitle: `"{days} days. {ingredients} ingredients. One legendary pot. Here's what's cooking."`

### Ingredient Icons

Each ingredient in "The Staples" table gets an emoji icon based on keyword matching (garlic → 🧄, mushroom → 🍄, etc.) with a 🥘 fallback.

### Sentiment Badges

Color-coded with the savory palette:
- Positive: `herb-green/10` bg + `herb-green` text
- Negative: `burnt-tomato/10` bg + `burnt-tomato` text
- Experimental: purple tones
- Neutral: amber tones

---

## 4. Content & Microcopy

| Section | Label | Description |
|---|---|---|
| Rating Chart | **The Stew's Journey** | Turns rating evolution into a narrative |
| Popular Ingredients | **The Staples** | Kitchen term for frequently used items |
| MVP Ingredients | **Flavor Champions** | Celebrates high-impact ingredients |
| Video Table | **The Tasting Notes** | Community feedback as culinary reviews |
| Ingredient Metrics | **Flavor Impact** | Focuses on result, not the math |
| Header Subtitle | Dynamic punchy copy | `{days} days. {n} ingredients. One legendary pot.` |
| Stats Labels | Days Simmering / Today's Taste / Ingredients Added | Thematic rewording |
| 404 Page | "This page fell off the stove." | On-brand error messaging |

---

## 5. Custom CSS Utilities

Defined as `@utility` directives in Tailwind v4:

```css
@utility bg-gradient-background   → Parchment to warm beige diagonal gradient
@utility bg-gradient-primary      → Broth Amber multi-stop gradient
@utility bg-gradient-accent       → Cream to warm beige gradient
@utility shadow-warm              → Warm amber-tinted drop shadow
@utility shadow-warm-lg           → Larger warm amber-tinted drop shadow
```

---

## 6. File Map

| File | Changes |
|---|---|
| `app/globals.css` | Full Savory Palette, dark mode, custom utilities, warm shadows |
| `app/layout.tsx` | Fraunces font, updated metadata |
| `components/ui/card.tsx` | `shadow-warm`, `font-serif` on titles |
| `app/components/StewHeader.tsx` | Steam SVG, dynamic subtitle, thematic stats |
| `app/components/RatingChart.tsx` | "The Stew's Journey", new sentiment colors, rounded bars |
| `app/components/PopularIngredients.tsx` | "The Staples", ingredient emoji icons, "Flavor Impact" |
| `app/components/MVPIngredients.tsx` | "Flavor Champions", warm gradient cards |
| `app/components/VideoTable.tsx` | "The Tasting Notes", themed badges, warm icon colors |
| `app/components/SentimentChart.tsx` | Updated sentiment colors |
| `app/not-found.tsx` | On-brand 404 page |
