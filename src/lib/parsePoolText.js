// Free-text mana pool entry. "2 plains 1 swamp" == "2 plains, swamp" == "WWB" == "2W B"
// == "{W}{W}{B}" -> W:2 B:1.
//
// Deliberate divergence from MTG notation: this is a POOL, not a cost, so "2W" means two
// white sources, not {2}{W}. The live summary line shows what was understood, so the
// interpretation is always visible.

import { emptyPool, ALLIED_PAIRS, ENEMY_PAIRS } from './manaPool.js'

const BASICS = { plains: 'W', island: 'U', swamp: 'B', mountain: 'R', forest: 'G' }
const COLORS = new Set(['w', 'u', 'b', 'r', 'g'])

// Both orderings map to the canonical pair key, so "u/w" and "w/u" agree.
const PAIRS = {}
for (const key of [...ALLIED_PAIRS, ...ENEMY_PAIRS]) {
  const [a, b] = key.toLowerCase()
  PAIRS[`${a}/${b}`] = key
  PAIRS[`${b}/${a}`] = key
}

const TOKEN = /\d+|\{[^}]*\}|[a-z]+(?:\/[a-z]+)*/g

// Any unique prefix works ("p", "pl", "plains"), and trailing junk is tolerated
// ("plainses"). The five basics have distinct initials — p i s m f — so they never
// collide with each other or with the colour letters w u b r g.
function matchBasic(word) {
  for (const [name, color] of Object.entries(BASICS)) {
    if (name.startsWith(word) || word.startsWith(name)) return color
  }
  return null
}

function isPrefixOf(word, ...names) {
  return names.some(name => name.startsWith(word))
}

// Adds `count` sources for one token. Returns false if the token means nothing.
function applyToken(pool, token, count) {
  if (token.startsWith('{')) {
    const inner = token.slice(1, -1)
    if (/^\d+$/.test(inner)) {
      pool.C += count * Number(inner)         // {2} in a pool is two colourless sources
      return true
    }
    if (PAIRS[inner]) {
      pool[PAIRS[inner]] += count
      return true
    }
    if (COLORS.has(inner)) {
      pool[inner.toUpperCase()] += count
      return true
    }
    if (inner === 'c') {
      pool.C += count
      return true
    }
    return false
  }

  if (PAIRS[token]) {
    pool[PAIRS[token]] += count
    return true
  }
  if (token.includes('/')) return false       // slashed but not a real pair

  const basic = matchBasic(token)
  if (basic) {
    pool[basic] += count
    return true
  }
  if (token === 'any' || token === 'rainbow') {
    pool.ANY += count
    return true
  }
  if (isPrefixOf(token, 'colorless', 'colourless')) {
    pool.C += count
    return true
  }

  // A bare letter run is always individual colours: "wwb" -> W:2 B:1, never a pair.
  if ([...token].every(ch => COLORS.has(ch))) {
    for (const ch of token) pool[ch.toUpperCase()] += count
    return true
  }

  return false
}

export function parsePoolText(text) {
  const pool = emptyPool()
  const unparsed = []
  if (!text) return { pool, unparsed }

  const tokens = String(text).toLowerCase().match(TOKEN) || []
  let pending = null                          // a leading integer applies to the next token

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      pending = Number(token)
      continue
    }
    const count = pending ?? 1
    pending = null
    if (!applyToken(pool, token, count)) unparsed.push(token)
  }
  // A dangling trailing count is mid-typing, not an error — ignored silently.

  return { pool, unparsed }
}

const FORMAT_ORDER = ['W', 'U', 'B', 'R', 'G', 'ANY', 'C', ...ALLIED_PAIRS, ...ENEMY_PAIRS]

const FORMAT_LABELS = { ANY: 'any', C: 'C' }

function formatLabel(kind) {
  if (FORMAT_LABELS[kind]) return FORMAT_LABELS[kind]
  if (kind.length === 2) return `${kind[0]}/${kind[1]}`
  return kind
}

// Canonical text for a pool. Round-trips: parsePoolText(formatPool(p)) === p.
export function formatPool(pool) {
  return FORMAT_ORDER
    .filter(kind => (pool[kind] || 0) > 0)
    .map(kind => `${pool[kind]}${formatLabel(kind)}`)
    .join(' ')
}
