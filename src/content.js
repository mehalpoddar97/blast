// All prompts are pre-written (no live AI calls), so the game never breaks mid-round.
// Each prompt has an intensity: chill (acquaintance-safe), spicy (friends tease), unhinged (absurd, never abusive).

export const GAMES = {
  brain: {
    id: 'brain',
    title: 'Same Brain Cell',
    emoji: '🧠',
    color: '#ff3d7f',
    promise: 'Can you predict how your friend thinks?',
    rules: [
      'Secretly pick YOUR answer.',
      'Then guess what the person named on screen picked.',
      'Guess right = +10. Everyone gets one guess.',
    ],
  },
  line: {
    id: 'line',
    title: "Where's the Line?",
    emoji: '📏',
    color: '#00d1ff',
    promise: 'Where does your friend draw the line?',
    rules: [
      'Secretly rate the situation from 1 to 10.',
      'Then guess the rating of the person named on screen.',
      'Exact or off by 1 = +10.',
    ],
  },
  auction: {
    id: 'auction',
    title: 'Going Once, Going Twice',
    emoji: '🔨',
    color: '#ffc700',
    promise: 'Bet on your own confidence.',
    rules: [
      'Out loud: bid how many answers you can say in 30 seconds.',
      'Highest bidder takes the challenge. Tie? The earlier bid wins.',
      'Hit your bid (the group confirms) = +10.',
    ],
  },
}

export const BRAIN = [
  // chill
  { id: 'b1', i: 'chill', q: 'Pick a fictional roommate', o: ['Bunny (YJHD)', 'Geet (Jab We Met)', 'Munna Bhai', 'Chatur (3 Idiots)'] },
  { id: 'b2', i: 'chill', q: 'Ideal Sunday morning', o: ['Sleep till noon', 'Long walk + chai', 'Brunch with friends', 'Clean the whole house'] },
  { id: 'b3', i: 'chill', q: 'Pick one street food forever', o: ['Puchka / Pani puri', 'Momos', 'Vada pav', 'Kathi roll'] },
  { id: 'b4', i: 'chill', q: 'At a wedding, you are most likely at the…', o: ['Dance floor', 'Food counter', 'Photo booth', 'Corner, on phone'] },
  { id: 'b5', i: 'chill', q: 'Superpower for one day', o: ['Teleport', 'Read minds', 'Pause time', 'Speak every language'] },
  { id: 'b6', i: 'chill', q: 'Dream holiday', o: ['Goa beach shack', 'Himalayan trek', 'Europe trip', 'Staycation, no plans'] },
  { id: 'b7', i: 'chill', q: 'Your phone dies at 5%. You…', o: ['Panic', 'Borrow a charger instantly', 'Enjoy the peace', 'Did not notice'] },
  { id: 'b8', i: 'chill', q: 'Pick a movie night snack', o: ['Popcorn', 'Maggi', 'Chips + dip', 'Ice cream tub'] },
  { id: 'b9', i: 'chill', q: 'Your go-to karaoke song vibe', o: ['90s Bollywood', 'Arijit heartbreak', 'English pop', 'I only clap'] },
  { id: 'b10', i: 'chill', q: 'Best way to spend a bonus', o: ['Travel', 'Gadgets', 'Save it all', 'Treat the family'] },
  { id: 'b11', i: 'chill', q: 'Which animal would you be?', o: ['Cat', 'Golden retriever', 'Owl', 'Sloth'] },
  { id: 'b12', i: 'chill', q: 'Pick your chai', o: ['Kadak masala', 'Elaichi', 'Green tea', 'I am a coffee person'] },
  // spicy
  { id: 'b13', i: 'spicy', q: 'In a group trip, you are the one who…', o: ['Plans everything', 'Is always late', 'Handles money', 'Just vibes'] },
  { id: 'b14', i: 'spicy', q: 'Reply time to an unknown text', o: ['Instantly', 'Within an hour', 'Next day', 'Never'] },
  { id: 'b15', i: 'spicy', q: 'Most likely to cry at…', o: ['A Karan Johar film', 'A dog video', 'A farewell', 'Nothing. Stone heart.'] },
  { id: 'b16', i: 'spicy', q: 'Biggest red flag on a first date', o: ['Rude to the waiter', 'Talks about ex', 'On phone all along', 'Splits bill to the rupee'] },
  { id: 'b17', i: 'spicy', q: 'Your relatives ask "shaadi kab?" You…', o: ['Laugh it off', 'Change topic to food', 'Give a fake date', 'Ask about their salary'] },
  { id: 'b18', i: 'spicy', q: 'Your secret group chat role', o: ['Meme supplier', 'Silent reader', 'Voice-note sender', 'The one who plans'] },
  { id: 'b19', i: 'spicy', q: 'Which would you forgive fastest?', o: ['Forgot your birthday', 'Spoiled a show', 'Ate your leftovers', 'Ditched last minute'] },
  { id: 'b20', i: 'spicy', q: 'Worst Monday morning disaster', o: ['No hot water', 'WiFi down', 'Surprise 9 am call', 'Out of coffee'] },
  // unhinged
  { id: 'b21', i: 'unhinged', q: 'You must survive a zombie attack with…', o: ['A pressure cooker', 'A cricket bat', 'Your mom’s chappal', 'A Bluetooth speaker'] },
  { id: 'b22', i: 'unhinged', q: 'You are a Bollywood villain. Your evil plan?', o: ['Steal all samosas', 'Ban weddings', 'Cancel monsoon', 'Make WiFi slow forever'] },
  { id: 'b23', i: 'unhinged', q: 'Pick one to delete from existence', o: ['Mosquitoes', 'Traffic', 'Reply-all emails', 'Group photos'] },
  { id: 'b24', i: 'unhinged', q: 'Your autobiography title', o: ['Kal Pakka Karunga', 'Bas 5 Minute', 'Main Toh Aisa Hi Hoon', 'Seen at 2:47 AM'] },
  { id: 'b25', i: 'unhinged', q: 'You can only eat one thing for a year', o: ['Biryani', 'Dosa', 'Pizza', 'Rajma chawal'] },
  { id: 'b26', i: 'unhinged', q: 'Your ghost would haunt…', o: ['Your office', 'Your ex', 'The building WhatsApp group', 'A Haldiram’s'] },
]

export const LINE = [
  { id: 'l1', i: 'chill', q: 'Putting ketchup on a dosa', lo: 'Totally fine', hi: 'Criminal' },
  { id: 'l2', i: 'chill', q: 'Pineapple on pizza', lo: 'Delicious', hi: 'Disgusting' },
  { id: 'l3', i: 'chill', q: 'Replying "k" to a long message', lo: 'Normal', hi: 'Declaration of war' },
  { id: 'l4', i: 'chill', q: 'Taking the last piece without asking', lo: 'Fair game', hi: 'Unforgivable' },
  { id: 'l5', i: 'chill', q: 'Wearing socks with sandals', lo: 'Iconic', hi: 'Fashion crime' },
  { id: 'l6', i: 'chill', q: 'Watching a series ahead of your partner', lo: 'Whatever', hi: 'Betrayal' },
  { id: 'l7', i: 'chill', q: 'Arriving 30 min late to a party', lo: 'On time (Indian time)', hi: 'So rude' },
  { id: 'l8', i: 'chill', q: 'Clapping when the plane lands', lo: 'Wholesome', hi: 'Please stop' },
  { id: 'l9', i: 'spicy', q: 'Leaving a date after 20 minutes', lo: 'Understandable', hi: 'Outrageous' },
  { id: 'l10', i: 'spicy', q: 'Re-gifting a wedding present', lo: 'Smart', hi: 'Shameful' },
  { id: 'l11', i: 'spicy', q: 'Checking your partner’s phone', lo: 'Fine', hi: 'Huge red flag' },
  { id: 'l12', i: 'spicy', q: 'Muting the family WhatsApp group', lo: 'Self-care', hi: 'Disowned' },
  { id: 'l13', i: 'spicy', q: 'Posting a story but ignoring texts', lo: 'Busy, relax', hi: 'Clearly avoiding me' },
  { id: 'l14', i: 'spicy', q: 'Asking for the bill split by what each ate', lo: 'Fair', hi: 'Kanjoos alert' },
  { id: 'l15', i: 'unhinged', q: 'Eating Maggi raw, straight from the packet', lo: 'Snack goals', hi: 'Seek help' },
  { id: 'l16', i: 'unhinged', q: 'Giving your pet its own Instagram', lo: 'Necessary', hi: 'Unhinged' },
  { id: 'l17', i: 'unhinged', q: 'Bringing your own masala to a 5-star restaurant', lo: 'Legend', hi: 'Mortifying' },
  { id: 'l18', i: 'unhinged', q: 'Proposing at a cricket stadium on the big screen', lo: 'Romantic', hi: 'Cringe' },
  { id: 'l19', i: 'unhinged', q: 'Naming your child after your favourite app', lo: 'Visionary', hi: 'Call CPS' },
]

export const AUCTION = [
  { id: 'a1', i: 'chill', q: 'Shah Rukh Khan movies' },
  { id: 'a2', i: 'chill', q: 'Indian sweets' },
  { id: 'a3', i: 'chill', q: 'Things you find in a kitchen' },
  { id: 'a4', i: 'chill', q: 'Indian cities' },
  { id: 'a5', i: 'chill', q: 'Cricketers, any country' },
  { id: 'a6', i: 'chill', q: 'Bollywood songs with "dil" in them' },
  { id: 'a7', i: 'chill', q: 'Apps on your phone (no peeking)' },
  { id: 'a8', i: 'chill', q: 'Things at an Indian wedding' },
  { id: 'a9', i: 'spicy', q: 'Believable excuses for leaving a party early' },
  { id: 'a10', i: 'spicy', q: 'Things aunties say at weddings' },
  { id: 'a11', i: 'spicy', q: 'Excuses for being late to office' },
  { id: 'a12', i: 'spicy', q: 'Lines you would never say on a first date' },
  { id: 'a13', i: 'spicy', q: 'Things your mom says when you are on the phone' },
  { id: 'a14', i: 'unhinged', q: 'Uses for a pressure cooker other than cooking' },
  { id: 'a15', i: 'unhinged', q: 'Worst names for a new restaurant' },
  { id: 'a16', i: 'unhinged', q: 'Things you should never say at a funeral' },
  { id: 'a17', i: 'unhinged', q: 'Rejected Bollywood movie titles' },
]

export const INTENSITIES = [
  { id: 'chill', label: 'Chill', emoji: '🧊', hint: 'Safe with new people' },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', hint: 'Friends who tease' },
  { id: 'unhinged', label: 'Unhinged', emoji: '🤪', hint: 'Absurd, never mean' },
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
