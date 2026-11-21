// All prompts are pre-written (no live AI calls), so nothing can break mid-round.
// Intensity: chill (safe with new people), spicy (friends who tease), unhinged (absurd, never abusive).

export const GAMES = {
  bomb: {
    id: 'bomb',
    title: 'BLAST Bomb',
    emoji: '💣',
    color: '#ff2e63',
    promise: "Don't be holding it when it blows.",
    tags: 'Loud • Panic • Fast',
    rules: [
      'A category appears. Say ONE answer out loud, tap PASS, hand the phone on.',
      'The bomb has a secret timer. It ticks faster and faster.',
      'Holding it when it BLASTS? Everyone else gets +10. You get the shame.',
    ],
    rounds: 3,
  },
  defend: {
    id: 'defend',
    title: 'Defend the Indefensible',
    emoji: '🎭',
    color: '#ffb800',
    promise: "Convince everyone you're right about something absurd.",
    tags: 'Persuasion • Performance • Chaos',
    rules: [
      'One player gets a terrible opinion. 30 seconds to defend it like a lawyer.',
      'Watch out: a PLOT TWIST may force you to switch sides mid-speech.',
      'The group rates you 1 to 5 🔥. Each 🔥 = +10.',
    ],
    rounds: 0, // 0 = everyone takes a turn (max 4 per episode)
  },
  accuse: {
    id: 'accuse',
    title: 'Accusation Station',
    emoji: '👉',
    color: '#00e0ff',
    promise: 'Predict who the group will throw under the bus.',
    tags: 'Social • Revealing • Funny',
    rules: [
      'One player secretly predicts who the group will point at.',
      'On 3-2-1, EVERYONE points at once. No take-backs.',
      'Predicted the most-pointed person? +20. The accused gets a crown 👑.',
    ],
    rounds: 0,
  },
  line: {
    id: 'line',
    title: "Where's the Line?",
    emoji: '📏',
    color: '#9dff3b',
    promise: "Read your friend's mind on a 1 to 10 scale.",
    tags: 'Opinions • Arguments • Chemistry',
    rules: [
      'One player secretly puts the situation on a scale from 1 to 10.',
      'Everyone else argues it out and agrees on ONE guess.',
      'Exact = +20 each. Off by 1 = +10 each. The mind-reader scores too.',
    ],
    rounds: 0,
  },
  auction: {
    id: 'auction',
    title: 'Going Once, Going Twice',
    emoji: '🔨',
    color: '#b14dff',
    promise: 'Bid on your own confidence. Then prove it.',
    tags: 'Competitive • Fast • Loud',
    rules: [
      'Out loud, bid how many answers you can name in 30 seconds.',
      'Highest bidder takes the challenge. Group taps the counter.',
      'Hit your bid = +30. Fall short = everyone else +10.',
    ],
    rounds: 3,
  },
}

export const ACCUSE = [
  { id: 'c1', i: 'chill', q: 'Who is most likely to become accidentally famous for something embarrassing?' },
  { id: 'c2', i: 'chill', q: 'Who is most likely to cry at a cartoon movie?' },
  { id: 'c3', i: 'chill', q: 'Who is most likely to get lost in their own city?' },
  { id: 'c4', i: 'chill', q: 'Who would survive the longest on a deserted island?' },
  { id: 'c5', i: 'chill', q: 'Who is most likely to reply to a message 3 days later with "haha"?' },
  { id: 'c6', i: 'chill', q: 'Who is most likely to start a dance-off at a wedding?' },
  { id: 'c7', i: 'chill', q: 'Who is most likely to forget their own birthday?' },
  { id: 'c8', i: 'chill', q: 'Who would win a cooking competition with only Maggi?' },
  { id: 'c9', i: 'spicy', q: 'Who is most likely to get blocked by their own mom?' },
  { id: 'c10', i: 'spicy', q: 'Who is most likely to text their ex at 2 AM?' },
  { id: 'c11', i: 'spicy', q: 'Who is most likely to fake being sick to skip a family function?' },
  { id: 'c12', i: 'spicy', q: 'Who has the most embarrassing search history?' },
  { id: 'c13', i: 'spicy', q: 'Who is most likely to be "just 5 minutes away" for an hour?' },
  { id: 'c14', i: 'spicy', q: 'Who is most likely to get married in Vegas by accident?' },
  { id: 'c15', i: 'spicy', q: 'Who is most likely to stalk a crush’s cousin’s Instagram?' },
  { id: 'c16', i: 'spicy', q: 'Who would be the worst person to share a hotel room with?' },
  { id: 'c17', i: 'unhinged', q: 'Who is most likely to start a cult by accident?' },
  { id: 'c18', i: 'unhinged', q: 'Who would get kicked out of a wedding by the bride’s nani?' },
  { id: 'c19', i: 'unhinged', q: 'Who is most likely to go viral for fighting an auto-wala?' },
  { id: 'c20', i: 'unhinged', q: 'Who is most likely to be secretly running a meme page?' },
  { id: 'c21', i: 'unhinged', q: 'Who would be the first to sell their friends for a lifetime supply of biryani?' },
  { id: 'c22', i: 'unhinged', q: 'Who is most likely to be arrested at their own birthday party?' },
]

export const LINE = [
  { id: 'l1', i: 'chill', q: 'Putting ketchup on a dosa', lo: 'Totally fine', hi: 'Criminal' },
  { id: 'l2', i: 'chill', q: 'Replying "k" to a long message', lo: 'Normal', hi: 'Declaration of war' },
  { id: 'l3', i: 'chill', q: 'Taking the last piece without asking', lo: 'Fair game', hi: 'Unforgivable' },
  { id: 'l4', i: 'chill', q: 'Wearing socks with sandals', lo: 'Iconic', hi: 'Fashion crime' },
  { id: 'l5', i: 'chill', q: 'Clapping when the plane lands', lo: 'Wholesome', hi: 'Please stop' },
  { id: 'l6', i: 'chill', q: 'Arriving 30 min late to a party', lo: 'On time (Indian time)', hi: 'So rude' },
  { id: 'l7', i: 'spicy', q: 'Getting engaged after three dates', lo: 'Romantic', hi: 'Absolutely unhinged' },
  { id: 'l8', i: 'spicy', q: 'Leaving a date after 20 minutes', lo: 'Understandable', hi: 'Outrageous' },
  { id: 'l9', i: 'spicy', q: 'Checking your partner’s phone', lo: 'Fine', hi: 'Huge red flag' },
  { id: 'l10', i: 'spicy', q: 'Muting the family WhatsApp group', lo: 'Self-care', hi: 'Disowned' },
  { id: 'l11', i: 'spicy', q: 'Re-gifting a wedding present', lo: 'Smart', hi: 'Shameful' },
  { id: 'l12', i: 'spicy', q: 'Posting a story but ignoring texts', lo: 'Busy, relax', hi: 'Clearly avoiding me' },
  { id: 'l13', i: 'unhinged', q: 'Eating Maggi raw, straight from the packet', lo: 'Snack goals', hi: 'Seek help' },
  { id: 'l14', i: 'unhinged', q: 'Bringing your own masala to a 5-star restaurant', lo: 'Legend', hi: 'Mortifying' },
  { id: 'l15', i: 'unhinged', q: 'Proposing on the big screen at a cricket match', lo: 'Romantic', hi: 'Cringe' },
  { id: 'l16', i: 'unhinged', q: 'Naming your child after your favourite app', lo: 'Visionary', hi: 'Call someone' },
  { id: 'l17', i: 'unhinged', q: 'Inviting your ex to your wedding as a guest', lo: 'Mature', hi: 'Chaos' },
]

export const AUCTION = [
  { id: 'a1', i: 'chill', q: 'Shah Rukh Khan movies' },
  { id: 'a2', i: 'chill', q: 'Indian sweets' },
  { id: 'a3', i: 'chill', q: 'Indian cities' },
  { id: 'a4', i: 'chill', q: 'Cricketers, any country' },
  { id: 'a5', i: 'chill', q: 'Bollywood songs with "dil" in them' },
  { id: 'a6', i: 'chill', q: 'Things at an Indian wedding' },
  { id: 'a7', i: 'spicy', q: 'Ridiculous excuses for cancelling a date' },
  { id: 'a8', i: 'spicy', q: 'Things aunties say at weddings' },
  { id: 'a9', i: 'spicy', q: 'Excuses for being late to office' },
  { id: 'a10', i: 'spicy', q: 'Lines you would never say on a first date' },
  { id: 'a11', i: 'spicy', q: 'Things your mom says when you are on the phone' },
  { id: 'a12', i: 'unhinged', q: 'Uses for a pressure cooker other than cooking' },
  { id: 'a13', i: 'unhinged', q: 'Worst names for a new restaurant' },
  { id: 'a14', i: 'unhinged', q: 'Rejected Bollywood movie titles' },
  { id: 'a15', i: 'unhinged', q: 'Things a ghost would complain about' },
]

export const BOMB = [
  // chill
  { id: 'k1', i: 'chill', q: 'Things you find at an Indian wedding' },
  { id: 'k2', i: 'chill', q: 'Shah Rukh Khan movies' },
  { id: 'k3', i: 'chill', q: 'Street foods' },
  { id: 'k4', i: 'chill', q: 'Indian cities' },
  { id: 'k5', i: 'chill', q: 'Things in your mom’s kitchen drawer' },
  { id: 'k6', i: 'chill', q: 'Cricketers, any country' },
  { id: 'k7', i: 'chill', q: 'Bollywood songs everyone dances to' },
  { id: 'k8', i: 'chill', q: 'Apps on your phone' },
  { id: 'k9', i: 'chill', q: 'Indian sweets' },
  { id: 'k10', i: 'chill', q: 'Things you carry on a Goa trip' },
  { id: 'k11', i: 'chill', q: 'Words that rhyme with "chai"' },
  { id: 'k12', i: 'chill', q: 'Animals you would NOT want as a pet' },
  // spicy
  { id: 'k13', i: 'spicy', q: 'Things aunties say at weddings' },
  { id: 'k14', i: 'spicy', q: 'Excuses for being late to office' },
  { id: 'k15', i: 'spicy', q: 'Red flags on a first date' },
  { id: 'k16', i: 'spicy', q: 'Things your parents say when you come home late' },
  { id: 'k17', i: 'spicy', q: 'Lies everyone tells on their CV' },
  { id: 'k18', i: 'spicy', q: 'Things you would never say to your boss' },
  { id: 'k19', i: 'spicy', q: 'Reasons to leave a party early' },
  { id: 'k20', i: 'spicy', q: 'Things people do on the metro that are illegal in your heart' },
  { id: 'k21', i: 'spicy', q: 'Worst things to hear from your dentist' },
  { id: 'k22', i: 'spicy', q: 'Ways to reply "seen" without replying' },
  // unhinged
  { id: 'k23', i: 'unhinged', q: 'Uses for a pressure cooker other than cooking' },
  { id: 'k24', i: 'unhinged', q: 'Rejected names for a new Bollywood movie' },
  { id: 'k25', i: 'unhinged', q: 'Things you should never say at a funeral' },
  { id: 'k26', i: 'unhinged', q: 'Terrible names for a baby' },
  { id: 'k27', i: 'unhinged', q: 'Things that would make your nani faint' },
  { id: 'k28', i: 'unhinged', q: 'Worst things to say during a wedding pheras' },
  { id: 'k29', i: 'unhinged', q: 'Things a villain would put in their Instagram bio' },
  { id: 'k30', i: 'unhinged', q: 'Worst items to bring to a job interview' },
  { id: 'k31', i: 'unhinged', q: 'New flavours of Maggi that should never exist' },
  { id: 'k32', i: 'unhinged', q: 'Excuses for why you have 47 unread messages' },
]

export const DEFEND = [
  // chill
  { id: 'd1', i: 'chill', q: 'Ketchup is the best topping for dosa' },
  { id: 'd2', i: 'chill', q: 'Pineapple belongs on every pizza' },
  { id: 'd3', i: 'chill', q: 'Monday is the best day of the week' },
  { id: 'd4', i: 'chill', q: 'Socks with sandals is high fashion' },
  { id: 'd5', i: 'chill', q: 'Cold chai is better than hot chai' },
  { id: 'd6', i: 'chill', q: 'Cricket is boring and should be banned' },
  { id: 'd7', i: 'chill', q: 'Sleeping 14 hours a day is a productivity hack' },
  { id: 'd8', i: 'chill', q: 'Pigeons are the most beautiful bird' },
  { id: 'd9', i: 'chill', q: 'Every song should be remixed' },
  // spicy
  { id: 'd28', i: 'spicy', q: 'Being left on read is a green flag' },
  { id: 'd10', i: 'spicy', q: 'Raisins make biryani better' },
  { id: 'd11', i: 'spicy', q: 'Replying "k" is the most respectful text' },
  { id: 'd12', i: 'spicy', q: 'You should always invite your ex to your wedding' },
  { id: 'd13', i: 'spicy', q: 'Splitting the bill by exactly what you ate is romantic' },
  { id: 'd14', i: 'spicy', q: 'Arriving 2 hours late is the most polite thing to do' },
  { id: 'd15', i: 'spicy', q: 'Your mom should run your dating app' },
  { id: 'd16', i: 'spicy', q: 'Reply-all on office emails is a human right' },
  { id: 'd17', i: 'spicy', q: 'Ghosting is the kindest way to break up' },
  { id: 'd18', i: 'spicy', q: 'Loud phone calls on speaker in public build community' },
  // unhinged
  { id: 'd19', i: 'unhinged', q: 'Eating raw Maggi from the packet is fine dining' },
  { id: 'd20', i: 'unhinged', q: 'Your pet should be allowed to vote' },
  { id: 'd21', i: 'unhinged', q: 'Bringing your own masala to a 5-star restaurant is classy' },
  { id: 'd22', i: 'unhinged', q: 'Weddings should last 3 weeks, minimum' },
  { id: 'd23', i: 'unhinged', q: 'Mosquitoes are misunderstood and deserve rights' },
  { id: 'd24', i: 'unhinged', q: 'Every office should have a nap pod and a DJ' },
  { id: 'd25', i: 'unhinged', q: 'Proposing on the big screen at a cricket match is the only valid way' },
  { id: 'd26', i: 'unhinged', q: 'Naming your child "WiFi" is visionary' },
  { id: 'd27', i: 'unhinged', q: 'The building WhatsApp group should run the country' },
]

export const INTENSITIES = [
  { id: 'chill', label: 'Chill', emoji: '🧊', hint: 'Safe with new people' },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', hint: 'Friends who tease' },
  { id: 'unhinged', label: 'Unhinged', emoji: '🤪', hint: 'Absurd, never mean' },
]

export const VENUES = [
  { id: 'quiet', label: 'Quiet place', emoji: '☕', hint: 'Cafe, office, metro' },
  { id: 'lively', label: 'House party', emoji: '🎉', hint: 'Go loud' },
]

export const DURATIONS = [
  { id: 12, label: '12 min' },
  { id: 20, label: '20 min' },
  { id: 30, label: '30 min' },
  { id: 0, label: 'Endless' },
]

// Chill includes only chill. Spicy includes chill+spicy. Unhinged includes all.
const LEVEL = { chill: 0, spicy: 1, unhinged: 2 }
export function promptsFor(bank, intensity) {
  return bank.filter((p) => LEVEL[p.i] <= LEVEL[intensity])
}
