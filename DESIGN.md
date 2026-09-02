# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate — user completes tasks (load scenario, check housing, see crafts) while playing.

## World

**Warm workshop** — a calm second-monitor companion. Feels like a well-lit crafting table: paper-warm surfaces, forest green actions, soft shadows. Terraria-adjacent without pastiche pixel art.

## Color

| Role | Value |
| --- | --- |
| Background | `#FAF8F5` |
| Surface | `#FFFFFF` |
| Border | `#E6E0D6` |
| Text | `#1A1816` |
| Muted | `#6F6860` |
| Accent (primary) | `#2F5C48` |
| Accent hover | `#244739` |
| Accent soft | `#E9F2EC` |
| Warning | `#9A5B1A` |
| Success | `#2F6B4F` |

No gradient text. No decorative blur. Accent only on primary actions and live status.

## Typography

- **Family:** Figtree (single family, weights 400/500/600)
- **Scale:** 0.8125rem labels · 1rem body · 1.25rem section · 2rem product name
- **Measure:** 42ch for prose hints

## Spacing

4px base. Sections 24px apart. Card padding 20px. Radius 12px surfaces, 8px controls.

## Components

- **Scenario chips:** primary entry — full-width on mobile, row on desktop
- **Status pill:** WebMCP connected / awaiting browser
- **Stat strip:** stage · tools · craft count (inline, not hero orb)
- **Details disclosure:** progress, inventory, bosses for power users

## Motion

150–200ms ease on hover/focus only. No page-load animation.
