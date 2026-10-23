# V1: Share messages over sound

V1 is an Expo (SDK 57) app for sending short text and links between nearby devices **over sound**: one device plays tones, and devices that are listening decode them. This first version is **frontend only**. The audio engine and the backend are mocked, so the full flow can be built and demoed without real sound processing.

It has two tabs:
- **Share**: switch between **Send** (type a message or `https://` link, then Broadcast) and **Receive** (Listen for nearby messages).
- **History**: everything this device sent or received, filterable by All / Sent / Received, with a detail screen for each item.

Full design docs live in [`project-spec/`](project-spec/):
- [`frontend-plan.md`](project-spec/frontend-plan.md): the design, security review, and decisions log
- [`nextsteps-10-22.md`](project-spec/nextsteps-10-22.md): known bugs, risks, and the roadmap

---

## Run it (web)

Web is the only platform tested so far.

```bash
npm install
cp .env.example .env.local      # sets EXPO_PUBLIC_API_URL=http://localhost:3001
npm run mock-server             # terminal 1: resets and serves mock-server/db.json on :3001
npx expo start --web            # terminal 2: opens the app on :8081
```

**Two-device demo:** open the app in **two browser tabs**. Broadcast from one, and Listen in the other. Each tab acts as a separate device.

| Script | What it does |
| --- | --- |
| `npm run mock-server` | Resets the mock DB from `db.seed.json`, then serves it on **localhost only** |
| `npm run mock-server:lan` | Same, but reachable from your network (for physical phones). **Trusted networks only**, because it has no authentication. |
| `npm run mock:reset` | Restores the seed data |

**Before you push:**
- Run `npx expo lint` and `npx tsc --noEmit`.
- Ask the team before adding a dependency. When you do add one, use `npx expo install <pkg>` so the version matches the SDK.
- Never put secrets in `EXPO_PUBLIC_*` variables (they're inlined into the app bundle) or in the mock DB.

---

## Key decisions and assumptions

| Decision | Why or what it assumes |
| --- | --- |
| "Audio code" means **data over sound** (tones), not a visual QR code | The core concept of the app |
| **Frontend only**: a mock sound engine and a json-server backend | The real audio engine plugs in later behind the `SoundEngine` interface without UI changes |
| The mock "air" is the server: a finished broadcast is POSTed to `/broadcasts`, and listeners poll for it | Lets two tabs or devices demo sending and receiving. Assumes devices share roughly the same clock. |
| Send / Receive **mode toggle**, one mode at a time, locked while active | Broadcasting and listening can never overlap |
| **140-character** payload limit | Data over sound is slow. Applies to typing, receiving, and server responses. |
| Received items are **auto-saved** to History | No manual Save step |
| Only **`https:`** links can be opened. **`http:` is blocked.** | Received content is untrusted. See Security. |
| Feedback via **toasts** only (no haptics) | Toast text is always a fixed string, never payload content |
| **Web first.** Native code is kept cross-platform but untested. | The current target |
| App name **"V1"**. URL scheme kept as `apptesting`. | Avoids breaking deep links and dev builds |
| History lives **only on the mock server** (no offline cache) | Keeps scope small |
| Orange and white theme with dark mode | Primary orange `#E06A00` so white bold button text stays readable |
| `deviceId` is random **per app load**, never stored | No tracking. Also makes two browser tabs act as two devices. |

---

## Security measures

Sound is a broadcast medium with no authentication: anyone nearby can send to you, and anyone nearby can hear you. So V1 treats every received message as **hostile** and every sent message as **public**.

- **Links:** only `https:` links open, and only after a confirmation dialog that shows the domain. Lookalike (punycode or non-English), IP-address, and very long domains get warnings. `javascript:`, `http:`, `tel:`, `intent:`, `data:`, and the app's own `apptesting://` links are never openable. On web, links open in a new tab that can't reach back into the app (`noopener`).
- **Text cleanup:** invisible and direction-reversing characters (zero-width, bidi overrides) and control characters are stripped. Length is capped at 140 everywhere.
- **No outside triggers:** "Re-broadcast" fills in the Share screen through in-app state, not the URL, so a link from another app can't inject text. Nothing ever broadcasts automatically.
- **Sender spoofing:** received items are labeled "Unverified sender". Re-broadcasting received content asks for confirmation first.
- **Secret check:** before broadcasting, the app warns if the text looks like a password, one-time code, card number, or API key.
- **Flooding and privacy:** received messages are de-duplicated and rate-limited. Listening shows a visible indicator and auto-stops after 60 seconds, on tab switch, or when the app goes to the background.
- **API hygiene:** 5-second request timeouts, runtime validation of every server response, an id check on the detail route (`/history/[id]`), and encoded URLs.
- **Mock server:** binds to localhost by default and holds fake data only. Its runtime `db.json` is gitignored.

The full list of 20 threats is in [`frontend-plan.md`, section 7](project-spec/frontend-plan.md).

---

## Project structure

```
src/
  app/                    routes (Expo Router)
    _layout.tsx           root Stack + theme, toast, and draft providers
    (tabs)/index.tsx      Share screen (Send / Receive)
    (tabs)/history.tsx    History list
    history/[id].tsx      Detail screen
  components/             UI: buttons, cards, dialogs, waveform, pulse ring, tab bars
  hooks/                  use-broadcast, use-listen, use-transmissions, ...
  services/               api.ts (fetch + validation), sound-engine.ts (mock), open-link
  state/                  toast + share-draft providers
  utils/                  payload.ts (sanitize, URL safety), sensitive.ts, format.ts
  constants/              theme.ts (colors), limits.ts (140 chars, timeouts)
mock-server/              db.seed.json (committed), reset-db.js, db.json (gitignored)
project-spec/             design docs and next steps
```

---

## What was done this session (2026-10-22)

1. **Planned** the app: concept, screens, data model, API contract, and a security review. Saved to `project-spec/frontend-plan.md`.
2. **Built the mock backend:** json-server with seed data (including a few hostile examples for testing), reset script, and env files.
3. **Themed** the Expo starter orange and white (light and dark), and renamed the app to V1.
4. **Built the data layer:** types, payload sanitizing and URL-safety rules, secret detection, a validated API client, and a per-load device id.
5. **Built the mock sound engine** and hooks for broadcasting, listening, history, and stop-on-leave.
6. **Built the UI:** Share, History, and Detail screens; shared components; toasts; and confirmation dialogs.
7. **Restructured routing** into a root Stack with a `(tabs)` group and the detail route. Removed unused starter files.
8. **Verified:** typecheck and lint pass, security rules were checked against test cases, and every route renders. No full in-browser click-through has been done yet.
9. **Documented** bugs, risks, and next steps, including a spec for a login modal.

**Dependencies added:** `expo-clipboard`, `expo-crypto`, and `json-server@0.17` (dev only).

---

## Known bugs and limitations

- **BUG-1:** History on web logs "`<button>` cannot contain a nested `<button>`". The history card is a button that contains its action buttons. The cause and suggested fix are documented; it isn't fixed yet.
- Not yet clicked through end to end in a browser, and never run on iOS or Android.
- Mock listening relies on device clocks, so physical devices with clock drift may miss messages.
- Copy fails on plain `http://<LAN IP>` addresses (the browser requires a secure origin there). `localhost` works.
- `npm audit` reports 21 warnings, all in Expo's own tooling. Don't run `npm audit fix --force`; it would break SDK version alignment.

Details are in [`nextsteps-10-22.md`](project-spec/nextsteps-10-22.md).

---

## Next steps

1. Fix BUG-1 (restructure the history card so the buttons are siblings, not nested).
2. Do a full web click-through using the checklist in `frontend-plan.md`, section 12.
3. Small polish: narrow the secret-check keywords and fix the unused low-contrast button variant.
4. Decide on automated tests (that would mean adding Jest, a new dependency).
5. Native pass on iOS and Android.
6. **Login modal (FEAT-1):** opened from the top menu, no separate page. Email and password checked against demo users in the mock server, with **salted + hashed** passwords and nothing requiring sign-in. **Demo only, never real credentials.** The full spec is in `nextsteps-10-22.md`, section 4.
7. Later: replace `MockSoundEngine` with a real data-over-sound engine.
