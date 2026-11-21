# 💥 BLAST

**A pocket game show for 2 to 12 friends. One phone. No sign-up. Pass it around.**

> Same app. Different people. Completely different chaos.

**Play now:** https://mehalpoddar97.github.io/mehalshivani/

Built from zero at Vibe Coders Hackathon Edition 3 (Kolkata, 21 Nov 2026), *Play* track, by Mehal Poddar and Shivani Bagaria.

## Who it's for

Friend groups in their 20s and 30s, at a dinner table, a house party, a cafe or a long walk, who want to play *together* without carrying a board game, downloading an app, or spending ten minutes deciding what to play. The content is India-first: Bollywood, weddings, chai, aunties, puchka.

## How to play (30 seconds)

1. Open the link. Tap **Start a BLAST**.
2. Type everyone's names, pick a vibe (**Chill / Spicy / Unhinged**), where you are, and how long you want to play.
3. The **mystery wheel** picks a mini-game. Read the 3-line rules.
4. Pass the phone. Each person plays their turn privately, then hands it on.
5. Big reveal, +10 BLAST points for every correct call, leaderboard, **Next round**.

A round takes 1 to 3 minutes. A new player is in as soon as their name is typed.

## The mini-games

| Game | What you do | Scoring |
|---|---|---|
| 🧠 **Same Brain Cell** | Secretly pick your answer to a 4-option question, then predict what the named friend picked. | Correct prediction = +10 |
| 📏 **Where's the Line?** | Secretly rate an absurd situation 1 to 10 ("ketchup on dosa"), then guess your friend's rating. | Exact or off by 1 = +10 |
| 🔨 **Going Once, Going Twice** | Bid out loud on how many answers you can name in 30 s. Highest bidder plays against a live timer and tap counter. | Group confirms you hit your bid = +10 |

## What makes it different

- **Truly one phone.** Private answers are hidden behind a "pass the phone to…" screen, so nobody sees anyone else's pick before the reveal.
- **It adapts to the group.** Vibe filters which prompts can appear. Venue changes which games come up (fewer shout-out-loud auctions in a quiet cafe). Player count changes the mix (more auctions with 3+).
- **Fair pairings.** Guessing games use a rotating round-robin: everyone guesses exactly one person and is guessed by exactly one person, and pairs change every round.
- **The wheel never lies.** The game is chosen first (weighted, never the same game twice in a row), then the wheel animates to it.
- **Never stuck.** Skip any prompt, refresh any time (the game is saved on the phone), time target ends with "One more round" or crowning the winner. Ties are joint winners.
- **Safe by design.** No accounts, no data leaves the phone, no AI calls at play time. All 60+ prompts are pre-written; "Unhinged" means absurd, never mean.

## Tech

React 18 + Vite, plain CSS, no backend. Deployed to GitHub Pages by a GitHub Action on every push to `main`. Game state lives in `localStorage` on the host phone.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

- `src/content.js` – all games, rules and prompts
- `src/logic.js` – pairings, game picker, prompt picker, scoring
- `src/App.jsx` – screens

## Decisions made for the hackathon

- One-phone pass-and-play shipped first; online rooms on separate phones are the next step.
- Teams, the personality quiz and AI-generated prompts were cut to keep the core loop solid.
