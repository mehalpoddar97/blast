import { useEffect, useRef, useState } from 'react'
import { GAMES, INTENSITIES, DURATIONS, VENUES } from './content.js'
import { pickGame, pickPrompt, scoreGuessRound, targetsFor, POINTS } from './logic.js'

const SAVE_KEY = 'blast-game-v1'

const fresh = () => ({
  screen: 'home',
  players: [],
  intensity: 'chill',
  venue: 'lively',
  duration: 12,
  startedAt: null,
  roundNo: 0,
  lastGame: null,
  used: [],
  round: null,
  history: [],
})

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY))
    if (s && s.screen) return s
  } catch {}
  return fresh()
}

function buzz(ms = 30) {
  try { navigator.vibrate && navigator.vibrate(ms) } catch {}
}

export default function App() {
  const [g, setG] = useState(load)
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(g)) } catch {}
  }, [g])
  const set = (patch) => setG((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  const setRound = (patch) => setG((s) => ({ ...s, round: { ...s.round, ...patch } }))

  const startRound = () =>
    setG((s) => {
      const game = pickGame(s.lastGame, s.players.length, s.venue)
      const prompt = pickPrompt(game, s.intensity, s.used)
      const n = s.players.length
      return {
        ...s,
        screen: 'wheel',
        lastGame: game,
        used: [...s.used, prompt.id],
        round: {
          game,
          prompt,
          targets: targetsFor(n, s.roundNo),
          // rotate who goes first each round
          order: Array.from({ length: n }, (_, k) => (k + s.roundNo) % n),
          turn: 0,
          step: 'pass',
          answers: {},
          guesses: {},
          opener: s.roundNo % n,
          bidder: null,
          bid: 3,
          count: 0,
        },
      }
    })

  // Swap the prompt (Skip prompt), keeping the same game and nobody's points change.
  const skipPrompt = () =>
    setG((s) => {
      const prompt = pickPrompt(s.round.game, s.intensity, s.used)
      return {
        ...s,
        used: [...s.used, prompt.id],
        round: { ...s.round, prompt, turn: 0, step: 'pass', answers: {}, guesses: {}, bidder: null, bid: 3, count: 0 },
      }
    })

  const applyScores = (results) =>
    setG((s) => {
      if (s.round.scored) return s // idempotent: a round can only score once
      const players = s.players.map((p, i) => {
        const r = results.find((x) => x.player === i)
        if (!r) return p
        return { ...p, score: p.score + r.points, hits: p.hits + (r.hit ? 1 : 0), tries: p.tries + 1 }
      })
      return {
        ...s,
        players,
        screen: 'reveal',
        round: { ...s.round, results, scored: true },
        history: [...s.history, { game: s.round.game, hits: results.filter((r) => r.hit).length }],
      }
    })

  const nextFromReveal = () => set((s) => ({ screen: 'board', roundNo: s.roundNo + 1 }))

  const screens = {
    home: <Home g={g} onStart={() => set({ screen: 'setup' })} onResume={() => set({ screen: g.round ? 'board' : 'setup' })} />,
    setup: (
      <Setup
        g={g}
        onBack={() => set({ screen: 'home' })}
        onGo={(players, intensity, duration, venue) => {
          setG({ ...fresh(), players, intensity, duration, venue, startedAt: Date.now(), screen: 'board-start' })
          startRound()
        }}
      />
    ),
    wheel: <Wheel g={g} onDone={() => set({ screen: 'rules' })} />,
    rules: <Rules g={g} onGo={() => set({ screen: 'play' })} onSkip={skipPrompt} />,
    play:
      g.round && g.round.game === 'auction' ? (
        <Auction g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
      ) : (
        <GuessGame g={g} setRound={setRound} onScore={applyScores} onSkip={skipPrompt} />
      ),
    reveal: <Reveal g={g} onNext={nextFromReveal} />,
    board: (
      <Board
        g={g}
        onNext={startRound}
        onFinish={() => set({ screen: 'summary' })}
      />
    ),
    summary: (
      <Summary
        g={g}
        onAgain={() => setG({ ...fresh(), players: g.players.map((p) => ({ ...p, score: 0, hits: 0, tries: 0 })), intensity: g.intensity, venue: g.venue, duration: g.duration, startedAt: Date.now(), screen: 'board-start' }) || startRound()}
        onHome={() => setG(fresh())}
      />
    ),
  }

  return (
    <div className="app">
      {g.screen !== 'home' && g.screen !== 'setup' && (
        <TopBar g={g} onQuit={() => { if (confirm('End this BLAST and go home?')) setG(fresh()) }} />
      )}
      <main key={g.screen + (g.round?.turn ?? '') + (g.round?.step ?? '')} className="screen">
        {screens[g.screen] || screens.home}
      </main>
    </div>
  )
}

/* ---------------- screens ---------------- */

function TopBar({ g, onQuit }) {
  const mins = g.startedAt ? Math.floor((Date.now() - g.startedAt) / 60000) : 0
  return (
    <header className="topbar">
      <span className="logo-sm">BLAST</span>
      <span className="muted">Round {g.roundNo + 1}{g.duration ? ` · ${mins}/${g.duration} min` : ''}</span>
      <button className="link" onClick={onQuit}>Quit</button>
    </header>
  )
}

function Home({ g, onStart, onResume }) {
  const canResume = g.players.length >= 2 && g.round
  return (
    <div className="center stack">
      <div className="burst">💥</div>
      <h1 className="logo">BLAST</h1>
      <p className="tag">A pocket game show for 2 to 12 friends.<br />One phone. No sign-up. Pass it around.</p>
      <button className="btn big" onClick={onStart}>Start a BLAST</button>
      {canResume && <button className="btn ghost" onClick={onResume}>Resume last game</button>}
      <p className="tiny muted">Same app. Different people. Completely different chaos.</p>
    </div>
  )
}

function Setup({ onBack, onGo }) {
  const [names, setNames] = useState(['', ''])
  const [intensity, setIntensity] = useState('chill')
  const [duration, setDuration] = useState(12)
  const [venue, setVenue] = useState('lively')
  const [err, setErr] = useState('')
  const inputs = useRef([])

  const update = (i, v) => setNames((n) => n.map((x, k) => (k === i ? v : x)))
  const add = () => {
    if (names.length >= 12) return
    setNames((n) => [...n, ''])
    setTimeout(() => inputs.current[names.length]?.focus(), 30)
  }
  const remove = (i) => setNames((n) => n.filter((_, k) => k !== i))

  const go = () => {
    const clean = names.map((n) => n.trim()).filter(Boolean)
    if (clean.length < 2) return setErr('Add at least 2 players.')
    const lower = clean.map((n) => n.toLowerCase())
    if (new Set(lower).size !== lower.length) return setErr('Two players have the same name. Add an initial.')
    onGo(clean.map((name) => ({ name, score: 0, hits: 0, tries: 0 })), intensity, duration, venue)
  }

  return (
    <div className="stack">
      <button className="link back" onClick={onBack}>← Back</button>
      <h2>Who's playing?</h2>
      <div className="names">
        {names.map((n, i) => (
          <div className="name-row" key={i}>
            <input
              ref={(el) => (inputs.current[i] = el)}
              value={n}
              maxLength={14}
              placeholder={`Player ${i + 1}`}
              onChange={(e) => { update(i, e.target.value); setErr('') }}
              onKeyDown={(e) => e.key === 'Enter' && (i === names.length - 1 ? add() : inputs.current[i + 1]?.focus())}
              autoFocus={i === 0}
            />
            {names.length > 2 && <button className="x" onClick={() => remove(i)} aria-label="remove">✕</button>}
          </div>
        ))}
        {names.length < 12 && <button className="btn ghost small" onClick={add}>+ Add player</button>}
      </div>

      <h3>Vibe</h3>
      <div className="chips">
        {INTENSITIES.map((x) => (
          <button key={x.id} className={'chip' + (intensity === x.id ? ' on' : '')} onClick={() => setIntensity(x.id)}>
            <span className="chip-emoji">{x.emoji}</span>{x.label}<small>{x.hint}</small>
          </button>
        ))}
      </div>

      <h3>Where are you?</h3>
      <div className="chips row">
        {VENUES.map((x) => (
          <button key={x.id} className={'chip slim' + (venue === x.id ? ' on' : '')} onClick={() => setVenue(x.id)}>
            <span className="chip-emoji">{x.emoji}</span>{x.label}<small>{x.hint}</small>
          </button>
        ))}
      </div>

      <h3>How long?</h3>
      <div className="chips row">
        {DURATIONS.map((x) => (
          <button key={x.id} className={'chip slim' + (duration === x.id ? ' on' : '')} onClick={() => setDuration(x.id)}>{x.label}</button>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      <button className="btn big sticky" onClick={go}>Let's BLAST →</button>
    </div>
  )
}

function Wheel({ g, onDone }) {
  // The game is already chosen; the wheel just animates to the real answer (it never lies).
  const order = ['brain', 'line', 'auction', 'brain', 'line', 'auction']
  const slice = 360 / order.length
  const [angle, setAngle] = useState(0)
  const [landed, setLanded] = useState(false)
  const game = GAMES[g.round.game]
  useEffect(() => {
    const idxs = order.map((x, i) => (x === g.round.game ? i : -1)).filter((i) => i >= 0)
    const idx = idxs[Math.floor(Math.random() * idxs.length)]
    const target = 360 * 5 + (360 - (idx * slice + slice / 2))
    const t1 = setTimeout(() => setAngle(target), 60)
    const t2 = setTimeout(() => { setLanded(true); buzz(80) }, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const grad = order.map((x, i) => `${GAMES[x].color} ${i * slice}deg ${(i + 1) * slice}deg`).join(',')
  return (
    <div className="center stack">
      <p className="muted">Spinning the mystery wheel…</p>
      <div className="wheel-wrap">
        <div className="pointer">▼</div>
        <div className="wheel" style={{ background: `conic-gradient(${grad})`, transform: `rotate(${angle}deg)` }}>
          {order.map((x, i) => (
            <span key={i} className="wheel-emoji" style={{ transform: `rotate(${i * slice + slice / 2}deg) translateY(-105px) rotate(${-(i * slice + slice / 2)}deg)` }}>
              {GAMES[x].emoji}
            </span>
          ))}
        </div>
      </div>
      <div className={'land' + (landed ? ' show' : '')}>
        <h2 style={{ color: game.color }}>{game.emoji} {game.title}</h2>
        <button className="btn big" onClick={onDone} disabled={!landed}>See the rules</button>
      </div>
    </div>
  )
}

function Rules({ g, onGo, onSkip }) {
  const game = GAMES[g.round.game]
  return (
    <div className="center stack">
      <div className="game-badge" style={{ background: game.color }}>{game.emoji}</div>
      <h2>{game.title}</h2>
      <p className="tag">{game.promise}</p>
      <ol className="rules">
        {game.rules.map((r) => <li key={r}>{r}</li>)}
      </ol>
      <button className="btn big" onClick={onGo}>Start round</button>
      <button className="link" onClick={onSkip}>Skip this prompt</button>
    </div>
  )
}

/* Same Brain Cell + Where's the Line: pass-and-play, private answers hidden between passes */
function GuessGame({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES[r.game]
  const me = r.order[r.turn]
  const target = r.targets[me]
  const meName = g.players[me].name
  const tName = g.players[target].name
  const isLine = r.game === 'line'
  const [val, setVal] = useState(isLine ? 5 : null)

  if (r.step === 'pass') {
    return (
      <div className="center stack pass">
        <p className="muted">Turn {r.turn + 1} of {g.players.length}</p>
        <h2>Pass the phone to</h2>
        <div className="big-name">{meName}</div>
        <p className="muted tiny">Everyone else, look away 👀</p>
        <button className="btn big" onClick={() => setRound({ step: 'answer' })}>I'm {meName}</button>
        {r.turn === 0 && <button className="link" onClick={onSkip}>Skip this prompt</button>}
      </div>
    )
  }

  const lock = () => {
    if (val === null) return
    buzz()
    if (r.step === 'answer') {
      setRound({ step: 'guess', answers: { ...r.answers, [me]: val } })
    } else {
      const guesses = { ...r.guesses, [me]: val }
      if (r.turn + 1 >= g.players.length) {
        const results = scoreGuessRound(r.game, g.players, r.answers, guesses, r.targets)
        setRound({ guesses })
        onScore(results)
      } else {
        setRound({ guesses, turn: r.turn + 1, step: 'pass' })
      }
    }
  }

  const asking = r.step === 'answer'
  return (
    <div className="stack">
      <p className="who" style={{ color: game.color }}>
        {asking ? `${meName}, your secret answer` : `${meName}, what did ${tName} pick?`}
      </p>
      <h2 className="prompt">{r.prompt.q}</h2>
      {isLine ? (
        <LineSlider prompt={r.prompt} val={val} setVal={setVal} color={game.color} />
      ) : (
        <div className="options">
          {r.prompt.o.map((o) => (
            <button key={o} className={'opt' + (val === o ? ' on' : '')} style={val === o ? { borderColor: game.color, background: game.color } : {}} onClick={() => { setVal(o); buzz(10) }}>
              {o}
            </button>
          ))}
        </div>
      )}
      {!asking && <p className="muted tiny center-text">Guess {tName}'s answer. Right = +{POINTS}{isLine ? ' (within 1 counts)' : ''}.</p>}
      <button className="btn big" disabled={val === null} onClick={lock}>
        {asking ? 'Lock my answer' : 'Lock my guess'}
      </button>
    </div>
  )
}

function LineSlider({ prompt, val, setVal, color }) {
  return (
    <div className="line">
      <div className="line-num" style={{ color }}>{val}</div>
      <input type="range" min="1" max="10" step="1" value={val} onChange={(e) => { setVal(Number(e.target.value)); buzz(5) }} style={{ accentColor: color }} />
      <div className="line-ends"><span>1 · {prompt.lo}</span><span>10 · {prompt.hi}</span></div>
    </div>
  )
}

/* Going Once, Going Twice: bid out loud, the app runs the 30s timer, the group confirms */
function Auction({ g, setRound, onScore, onSkip }) {
  const r = g.round
  const game = GAMES.auction
  const [left, setLeft] = useState(30)
  const opener = g.players[r.opener].name

  useEffect(() => {
    if (r.step !== 'timer') return
    setLeft(30)
    const start = Date.now()
    const id = setInterval(() => {
      const l = Math.max(0, 30 - Math.floor((Date.now() - start) / 1000))
      setLeft(l)
      if (l <= 5 && l > 0) buzz(20)
      if (l === 0) { clearInterval(id); buzz(300); setRound({ step: 'confirm' }) }
    }, 200)
    return () => clearInterval(id)
  }, [r.step])

  if (r.step === 'pass') {
    return (
      <div className="stack">
        <p className="who" style={{ color: game.color }}>Category</p>
        <h2 className="prompt">{r.prompt.q}</h2>
        <p className="tag">How many can you name in 30 seconds?<br /><b>{opener}</b> opens the bidding. Go round, out loud. Each bid must go higher.{g.venue === 'quiet' ? ' Inside voices, you are in public 🤫' : ''}</p>
        <h3>Who won the bid?</h3>
        <div className="chips row wrap">
          {g.players.map((p, i) => (
            <button key={i} className={'chip slim' + (r.bidder === i ? ' on' : '')} onClick={() => setRound({ bidder: i })}>{p.name}</button>
          ))}
        </div>
        <h3>Winning bid</h3>
        <div className="stepper">
          <button onClick={() => setRound({ bid: Math.max(1, r.bid - 1) })}>−</button>
          <span>{r.bid}</span>
          <button onClick={() => setRound({ bid: Math.min(30, r.bid + 1) })}>+</button>
        </div>
        <button className="btn big" disabled={r.bidder === null} onClick={() => setRound({ step: 'timer', count: 0 })}>Start 30s timer</button>
        <button className="link" onClick={onSkip}>Skip this category</button>
      </div>
    )
  }

  const bidderName = g.players[r.bidder].name

  if (r.step === 'timer') {
    return (
      <div className="center stack">
        <p className="who" style={{ color: game.color }}>{bidderName} needs {r.bid}</p>
        <h2 className="prompt">{r.prompt.q}</h2>
        <div className={'timer' + (left <= 5 ? ' hot' : '')}>{left}</div>
        <button className="counter" onClick={() => { setRound({ count: r.count + 1 }); buzz(15) }}>
          <span>{r.count}</span>
          <small>Tap for each valid answer</small>
        </button>
        <button className="link" onClick={() => setRound({ step: 'confirm' })}>Stop early</button>
      </div>
    )
  }

  // confirm
  const finish = (hit) => {
    const results = g.players.map((_, i) => ({ player: i, hit: i === r.bidder && hit, points: i === r.bidder && hit ? POINTS : 0, skip: i !== r.bidder }))
      .filter((x) => !x.skip)
    onScore(results)
  }
  return (
    <div className="center stack">
      <h2>Time!</h2>
      <p className="tag">{bidderName} bid <b>{r.bid}</b>. Counter says <b>{r.count}</b>.</p>
      <p className="muted">Group: did {bidderName} really hit {r.bid} valid answers?</p>
      <button className="btn big" onClick={() => finish(true)}>✅ Yes, +{POINTS} to {bidderName}</button>
      <button className="btn ghost" onClick={() => finish(false)}>❌ No, they fell short</button>
    </div>
  )
}

function Reveal({ g, onNext }) {
  const r = g.round
  const game = GAMES[r.game]
  const [shown, setShown] = useState(0)
  const rows = r.results || []
  useEffect(() => {
    if (shown >= rows.length) return
    const t = setTimeout(() => { setShown((s) => s + 1); buzz(rows[shown]?.hit ? 60 : 10) }, shown === 0 ? 300 : 900)
    return () => clearTimeout(t)
  }, [shown])

  if (r.game === 'auction') {
    const x = rows[0]
    return (
      <div className="center stack">
        <div className="burst">{x.hit ? '🎉' : '💸'}</div>
        <h2>{x.hit ? `${g.players[x.player].name} delivered!` : `${g.players[x.player].name} overbid!`}</h2>
        <p className="tag">{x.hit ? `+${POINTS} BLAST points` : 'No points this time.'}</p>
        <button className="btn big" onClick={onNext}>Scores →</button>
      </div>
    )
  }

  const show = (v) => (r.game === 'line' ? `${v}/10` : v)
  return (
    <div className="stack">
      <p className="who" style={{ color: game.color }}>{game.emoji} The reveal</p>
      <h2 className="prompt small">{r.prompt.q}</h2>
      <div className="reveal-list">
        {rows.map((x, k) => (
          <div key={k} className={'reveal-row' + (k < shown ? ' in' : '') + (x.hit ? ' hit' : '')}>
            <div>
              <b>{g.players[x.player].name}</b> guessed <b>{g.players[x.target].name}</b> → {show(x.guess)}
              <div className="muted tiny">{g.players[x.target].name} actually said: {show(x.actual)}</div>
            </div>
            <span className="pts">{x.hit ? `+${POINTS}` : '✗'}</span>
          </div>
        ))}
      </div>
      {shown >= rows.length && (
        <>
          <p className="center-text tag">{rows.filter((x) => x.hit).length === 0 ? 'Zero brain cells shared. Wow.' : rows.every((x) => x.hit) ? 'One brain cell, whole group. 🧠' : `${rows.filter((x) => x.hit).length} of ${rows.length} nailed it.`}</p>
          <button className="btn big" onClick={onNext}>Scores →</button>
        </>
      )}
    </div>
  )
}

function ranked(players) {
  return players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score)
}

function Board({ g, onNext, onFinish }) {
  const list = ranked(g.players)
  const elapsed = g.startedAt ? (Date.now() - g.startedAt) / 60000 : 0
  const timeUp = g.duration > 0 && elapsed >= g.duration
  const top = list[0]?.score ?? 0
  return (
    <div className="stack">
      <h2>Leaderboard</h2>
      <div className="board">
        {list.map((p, k) => (
          <div key={p.i} className={'board-row' + (p.score === top && top > 0 ? ' lead' : '')}>
            <span className="rank">{p.score === top && top > 0 ? '👑' : k + 1}</span>
            <span className="bname">{p.name}</span>
            <span className="muted tiny">{p.hits}/{p.tries} hits</span>
            <span className="bscore">{p.score}</span>
          </div>
        ))}
      </div>
      {timeUp && <p className="center-text tag">⏰ You hit your {g.duration}-minute target!</p>}
      <button className="btn big" onClick={onNext}>{timeUp ? 'One more round' : 'Next round 🎡'}</button>
      <button className={'btn ' + (timeUp ? '' : 'ghost')} onClick={onFinish}>Finish & crown the winner</button>
    </div>
  )
}

function Summary({ g, onAgain, onHome }) {
  const list = ranked(g.players)
  const top = list[0]?.score ?? 0
  const winners = list.filter((p) => p.score === top)
  const rounds = g.history.length
  return (
    <div className="center stack">
      <div className="confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.15}s`, background: ['#ff3d7f', '#00d1ff', '#ffc700', '#7cff6b'][i % 4] }} />)}</div>
      <div className="burst">🏆</div>
      <h2>{top === 0 ? 'Everybody tied at zero 😅' : winners.length > 1 ? 'Joint winners!' : 'Winner!'}</h2>
      {top > 0 && <div className="big-name">{winners.map((w) => w.name).join(' & ')}</div>}
      <p className="tag">{top} points · {rounds} round{rounds === 1 ? '' : 's'} played</p>
      <div className="board">
        {list.map((p) => (
          <div key={p.i} className="board-row"><span className="bname">{p.name}</span><span className="bscore">{p.score}</span></div>
        ))}
      </div>
      <button className="btn big" onClick={onAgain}>Play again, same squad</button>
      <button className="btn ghost" onClick={onHome}>New group</button>
    </div>
  )
}
