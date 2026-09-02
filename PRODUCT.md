# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite, React, TypeScript. Static deploy on Vercel. WebMCP imperative API (`document.modelContext.registerTool`).

## Users

Terraria players on PC with a second monitor. They want crafting, housing, and progression help without wiki spoilers or ChatGPT guessing from training data.

## Product Purpose

Fog exposes progress-gated WebMCP tools so an agent only sees recipes and hints for what the player has unlocked. Success means trustworthy, spoiler-safe help tied to live player state.

## Positioning

Tools register and unregister by boss stage — the agent cannot call locked capabilities. The page is the source of truth, not model memory.

## Voice

Calm, direct, game-native. No hype. Short labels. Errors say what to do next.

## Constraints

- WebMCP requires HTTPS or localhost; ChatGPT desktop or Chrome 149+ with testing flag.
- Game data is curated subset; expand with wiki attribution when growing dataset.
- Hackathon demo: three one-click scenarios for judges.

## Anti-references

Purple gradients, glassmorphism decoration, psychedelic aurora, dashboard card soup, duplicate prompt cheatsheets on the page.
