# 💥 BLAST

**A pocket game show for 2 to 12 friends. One phone. No sign-up. Pass it around.**

> Same app. Different people. Completely different chaos.

**Play now:** https://blast.edumate.co.in (backup: https://mehalpoddar97.github.io/blast/)

Built from zero at Vibe Coders Hackathon Edition 3 (Kolkata, 21 Nov 2026), *Play* track, by Mehal Poddar and Shivani Bagaria.

## Who it's for

Friend groups in their 20s and 30s, at a dinner table, a house party, a cafe or a long walk, who want to play *together* without carrying a board game, downloading an app, or spending ten minutes deciding what to play. The content is India-first: Bollywood, weddings, chai, aunties, puchka.

## How to play (30 seconds)

1. Open the link. Tap **Start a BLAST**, type everyone's names.
2. **Vibe check:** the group answers 3 taps together (where are you, how well do you know each other, roast tolerance), then each player picks their party move and gets an archetype card: 😈 Instigator, 🧠 Strategist, 🎤 Performer or 🫶 Connector.
3. The **slot machine** picks a game tuned to your squad. Read the 3-line rules.
4. Play a 2 to 4 round **episode**. Then **Next game 🎰** for the same group, or pick one yourself. Scores carry over.
5. Finish whenever you like: the winner gets crowned (ties are joint winners).

## The five games

| Game | What happens | Scoring |
|---|---|---|
| 💣 **BLAST Bomb** | A category appears. Say one answer, tap PASS, hand the phone on. A secret 20–45 s fuse ticks faster and faster until it explodes. | Everyone except the holder +10 |
| 🎭 **Defend the Indefensible** | Argue an absurd opinion ("Being left on read is a green flag") for 30 s. A surprise PLOT TWIST can flip you to the other side mid-speech. | Group rates 1 to 5 🔥, +10 per 🔥 |
| 👉 **Accusation Station** | One player secretly predicts who the group will point at. 3-2-1 POINT! | Right prediction +20, the accused gets a crown |
| 📏 **Where's the Line?** | One player secretly places a situation on a 1 to 10 scale. The group argues and agrees on one guess. | Exact +20 each, off by 1 +10 each |
| 🔨 **Going Once, Going Twice** | Bid out loud on how many answers you can name in 30 s. SOLD! Live timer and tap counter. | Hit your bid +30, fall short = everyone else +10 |

## The prompt deck

120+ prompts across five games and three spice levels (Chill, Spicy, Unhinged), drafted with AI and hand-curated for Indian friend groups: Bollywood, weddings, aunties, chai, office life. They are pre-written and bundled with the app, so play never waits on a network call or breaks mid-round, and "Unhinged" stays absurd rather than mean.

## Matching games to the crowd

| How well you know each other | Games allowed | Prompts |
|---|---|---|
| We just met | Icebreakers first: Bomb, Defend, Going Once. Where's the Line unlocks after 2 games. Accusation Station stays locked. | Capped at Spicy |
| Good friends | All five | As chosen |
| Dark secrets | All five, Accusation and Where's the Line favoured | As chosen |

Venue shifts the mix too (quiet spot = fewer shouty games, house party = more), and each player's archetype boosts their favourite games. The slot machine shows a one-line reason for every pick, e.g. "Picked because you just met: zero mind-reading needed".

## Group sizes (2 to 12)

| Players | Mode | Spotlight |
|---|---|---|
| 2 | Duo | Alternates |
| 3–5 | Individual | Fewest turns goes next |
| 6–8 | 2 balanced teams | Team by team, members rotate |
| 9–12 | 3 balanced teams | Team by team, members rotate |

Every session is capped at **5 games × 3 rounds**, so it lasts about 25–35 minutes at any size. Teams score the best result among their members each round (never the sum), so bigger teams get no edge.

## What makes it different

- **Truly one phone.** Secret picks hide behind "pass the phone to…" screens.
- **It adapts to the group.** Roast tolerance filters the 120+ pre-written prompts (Chill, Spicy, Unhinged). Venue, how well you know each other, and each player's archetype weight which games the slot machine lands on. The machine never repeats the last game.
- **Game-show energy.** Maximalist sticker design, slot machine, countdowns, explosions, and every sound synthesised live in the browser (no audio files). Haptics on Android. Mute button in the corner.
- **Never stuck.** Skip any prompt, "? Rules" infographic any time, Quit menu to switch games (and choose whether that game's points count), refresh any time (the game is saved on the phone).
- **Shareable.** The final leaderboard becomes a 1080×1920 Instagram-story card.
- **Safe by design.** No accounts, no data leaves the phone, no AI calls at play time. "Unhinged" means absurd, never mean.

## Tech

React 18 + Vite, plain CSS, no backend. Deployed to GitHub Pages by a GitHub Action on every push to `main`. Game state lives in `localStorage` on the host phone.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

- `src/content.js` – all games, rules and prompts
- `src/logic.js` – game picker, prompt picker, group profile
- `src/App.jsx` – screens
- `src/sound.js` – Web Audio sound effects

## Decisions made for the hackathon

- One-phone pass-and-play shipped first; online rooms on separate phones are the next step.
- Teams and AI-generated prompts were cut to keep the core loop solid.
