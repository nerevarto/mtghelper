// What each kind of mana source can produce. Hardcoded rather than derived from card
// data — lands aren't in the dataset, and you bring your own lands to any format anyway.
export const SOURCE_PRODUCES = {
  W: ['W'], U: ['U'], B: ['B'], R: ['R'], G: ['G'],
  C: ['C'],                                   // colorless: {C} pips and generic only
  ANY: ['W', 'U', 'B', 'R', 'G'],             // rainbow: any colour, but NOT {C}
  WU: ['W', 'U'], UB: ['U', 'B'], BR: ['B', 'R'], RG: ['R', 'G'], GW: ['G', 'W'],
  WB: ['W', 'B'], UR: ['U', 'R'], BG: ['B', 'G'], RW: ['R', 'W'], GU: ['G', 'U'],
}

export const SOURCE_KINDS = Object.keys(SOURCE_PRODUCES)

export const BASIC_KINDS = ['W', 'U', 'B', 'R', 'G']
export const ALLIED_PAIRS = ['WU', 'UB', 'BR', 'RG', 'GW']
export const ENEMY_PAIRS = ['WB', 'UR', 'BG', 'RW', 'GU']

export const SOURCE_LABELS = {
  W: 'W', U: 'U', B: 'B', R: 'R', G: 'G',
  C: '◇', ANY: '◆',
  WU: 'W/U', UB: 'U/B', BR: 'B/R', RG: 'R/G', GW: 'G/W',
  WB: 'W/B', UR: 'U/R', BG: 'B/G', RW: 'R/W', GU: 'G/U',
}

export const SOURCE_TITLES = {
  W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green',
  C: 'Colorless', ANY: 'Any colour',
  WU: 'White or blue', UB: 'Blue or black', BR: 'Black or red', RG: 'Red or green', GW: 'Green or white',
  WB: 'White or black', UR: 'Blue or red', BG: 'Black or green', RW: 'Red or white', GU: 'Green or blue',
}

export function emptyPool() {
  const pool = {}
  for (const kind of SOURCE_KINDS) pool[kind] = 0
  return pool
}

export function poolTotal(pool) {
  let total = 0
  for (const kind of SOURCE_KINDS) total += pool[kind] || 0
  return total
}

// Merges a stored pool over emptyPool(): unknown keys dropped, values coerced to
// non-negative integers. Lets a pool saved before a shape change degrade gracefully.
export function normalizePool(stored) {
  const pool = emptyPool()
  if (!stored || typeof stored !== 'object') return pool
  for (const kind of SOURCE_KINDS) {
    const n = Math.floor(Number(stored[kind]))
    pool[kind] = Number.isFinite(n) && n > 0 ? n : 0
  }
  return pool
}
