# Files in /app and what they include

## /app

### /app/(tabs)

#### /app/(tabs)/index.tsx

The main share screen — send and receive messages over sound. Provides a segmented control to toggle between "Send" and "Receive" modes, a payload input, waveform visualization, and buttons to broadcast or listen for nearby messages.

#### /app/(tabs)/_layout.tsx

Tab navigator layout. Defines the tab bar configuration and wraps tab screens.

## /app

### /app/_layout.tsx

Root layout — sets up the theme provider (light/dark), share draft state, toast notifications, and the Stack navigator that renders the tabs and history detail screens.

### /app/history/[id].tsx

Transmission detail screen. Displays full info for a single sent or received transmission (direction, type, timestamp, airtime, payload, sender) with actions to re-broadcast, copy, or open a link.

## /components

## /constants

## /hooks

## /services

## /state

## /types

### /types/ggwave.d.ts

Type declarations for ggwave

## /utils

### /utils/ggwave-utils.ts

Helper functions for ggwave to be used in the app

### /utils/format.ts

### /utils/payload.ts

### /utils/sensitive.ts
