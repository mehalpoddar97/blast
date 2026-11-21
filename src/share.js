import { ARCHETYPES } from './content.js'

// Draws a 1080x1920 Instagram-story leaderboard card and shares or downloads it.
// No private answers are included: only names, archetypes and points.
export async function drawCard({ players, squad }) {
  try { await document.fonts.load('80px "Luckiest Guy"') } catch {}
  const W = 1080, H = 1920
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const x = c.getContext('2d')
  const F = (size) => `${size}px "Luckiest Guy", Bungee, sans-serif`

  // background: hot gradient + halftone dots + rays
  const bg = x.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#3b0a8f'); bg.addColorStop(0.5, '#7a0a6e'); bg.addColorStop(1, '#14002e')
  x.fillStyle = bg; x.fillRect(0, 0, W, H)
  x.save(); x.translate(W / 2, 520)
  for (let i = 0; i < 24; i++) {
    x.rotate((Math.PI * 2) / 24)
    x.fillStyle = i % 2 ? 'rgba(255,230,0,0.07)' : 'rgba(255,46,99,0.07)'
    x.beginPath(); x.moveTo(0, 0); x.lineTo(-90, -1600); x.lineTo(90, -1600); x.fill()
  }
  x.restore()
  x.fillStyle = 'rgba(255,255,255,0.08)'
  for (let yy = 0; yy < H; yy += 36) for (let xx = (yy / 36) % 2 ? 18 : 0; xx < W; xx += 36) { x.beginPath(); x.arc(xx, yy, 3, 0, 7); x.fill() }

  const shadowText = (t, px, py, size, color, align = 'center', rot = 0) => {
    x.save(); x.translate(px, py); x.rotate(rot)
    x.font = F(size); x.textAlign = align; x.textBaseline = 'middle'
    x.fillStyle = '#0b0018'; x.fillText(t, 14, 14)
    x.fillStyle = '#ff2e63'; x.fillText(t, 7, 7)
    x.fillStyle = color; x.fillText(t, 0, 0)
    x.restore()
  }

  shadowText('BLAST', W / 2, 190, 200, '#ffe600', 'center', -0.06)
  shadowText(squad, W / 2, 360, squad.length > 20 ? 58 : 70, '#ffffff')

  const list = players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score)
  const top = list[0]?.score ?? 0
  const winners = list.filter((p) => p.score === top && top > 0)

  // crown block
  x.fillStyle = '#ffffff'; x.font = '160px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText('👑', W / 2, 540)
  shadowText(winners.length ? winners.map((w) => w.name).join(' & ') : 'Everyone tied!', W / 2, 700, winners.length > 1 ? 80 : 110, '#ffe600', 'center', -0.03)

  // rows
  const rows = list.slice(0, 8)
  const rowH = Math.min(120, 900 / rows.length)
  let y = 840
  rows.forEach((p, k) => {
    const lead = p.score === top && top > 0
    x.save(); x.translate(W / 2, y + rowH / 2); x.rotate(k % 2 ? 0.012 : -0.012)
    const w = 900, h = rowH - 20
    x.fillStyle = '#0b0018'; roundRect(x, -w / 2 + 12, -h / 2 + 12, w, h, 30); x.fill()
    x.fillStyle = lead ? '#ffe600' : '#ffffff'; roundRect(x, -w / 2, -h / 2, w, h, 30); x.fill()
    x.lineWidth = 6; x.strokeStyle = '#0b0018'; x.stroke()
    x.fillStyle = '#0b0018'; x.textBaseline = 'middle'
    x.font = F(Math.min(60, h * 0.55)); x.textAlign = 'left'
    x.fillText(`${k + 1}. ${p.name}`, -w / 2 + 40, 4)
    const a = ARCHETYPES[p.arch]
    if (a) { x.font = `${Math.min(56, h * 0.5)}px serif`; x.fillText(a.emoji, w / 2 - 260, 0) }
    x.font = F(Math.min(64, h * 0.6)); x.textAlign = 'right'
    x.fillText(String(p.score), w / 2 - 40, 4)
    x.restore()
    y += rowH
  })

  shadowText('One phone. No sign-up. Pure chaos.', W / 2, H - 150, 46, '#00e0ff')
  x.font = '600 34px Inter, sans-serif'; x.fillStyle = 'rgba(255,255,255,0.8)'; x.textAlign = 'center'
  x.fillText('Play BLAST: mehalpoddar97.github.io/blast', W / 2, H - 80)
  return c
}

function roundRect(x, l, t, w, h, r) {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r)
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath()
}

export async function shareCard(data) {
  const c = await drawCard(data)
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'))
  const file = new File([blob], 'blast-leaderboard.png', { type: 'image/png' })
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'BLAST leaderboard' })
      return 'shared'
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'blast-leaderboard.png'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return c.toDataURL('image/png')
}
