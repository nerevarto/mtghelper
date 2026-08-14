// Mana-payment feasibility. A cost is payable iff BOTH hold:
//
//   1. A bipartite matching saturates every coloured pip, where source kind t can serve
//      pip p iff SOURCE_PRODUCES[t] intersects p.opts, each kind having capacity pool[t].
//   2. poolTotal(pool) >= generic + pips.length.
//
// Rule 2 is sufficient for the generic portion because EVERY source kind can pay generic,
// so only the leftover count matters once colours are satisfied. Rule 1 genuinely needs
// augmenting paths, not greedy counting — greedy gets {W}{W} from WU + RW wrong.

import { SOURCE_KINDS, SOURCE_PRODUCES, poolTotal } from './manaPool.js'
import { parseManaCost } from './manaCost.js'

function canServe(kind, pip) {
  const produces = SOURCE_PRODUCES[kind]
  for (const opt of pip.opts) {
    if (produces.includes(opt)) return true
  }
  return false
}

// Kuhn's algorithm. Capacities are expanded into unit slots; a kind never needs more
// slots than there are pips, which keeps the slot list tiny however big the pool is.
function matchesAllPips(pool, pips) {
  if (pips.length === 0) return true

  const slots = []
  for (const kind of SOURCE_KINDS) {
    const n = Math.min(pool[kind] || 0, pips.length)
    for (let i = 0; i < n; i++) slots.push(kind)
  }
  if (slots.length < pips.length) return false

  const owner = new Array(slots.length).fill(-1)

  function assign(pipIndex, seen) {
    for (let s = 0; s < slots.length; s++) {
      if (seen[s] || !canServe(slots[s], pips[pipIndex])) continue
      seen[s] = true
      if (owner[s] === -1 || assign(owner[s], seen)) {
        owner[s] = pipIndex
        return true
      }
    }
    return false
  }

  for (let i = 0; i < pips.length; i++) {
    if (!assign(i, new Array(slots.length).fill(false))) return false
  }
  return true
}

// Generic-hybrid pips ({2/W}) are partitioned into colour-paid vs generic-paid by
// enumerating all 2^k masks (k <= 3 in printed cards). ok is true if ANY split works;
// maxX is the maximum spare mana over the FEASIBLE splits only. A fixed formula on the
// unsplit cost is wrong: {X}{2/W} with WU:3 gives X<=2 via colour but X<=1 via generic.
export function evaluate(pool, cost) {
  if (!cost) return { ok: false, maxX: 0 }

  const total = poolTotal(pool)
  const fixed = []
  const splittable = []
  for (const pip of cost.pips) {
    if (pip.altGeneric === undefined) fixed.push(pip)
    else splittable.push(pip)
  }

  let ok = false
  let maxX = 0

  for (let mask = 0; mask < (1 << splittable.length); mask++) {
    let generic = cost.generic
    const pips = [...fixed]
    for (let i = 0; i < splittable.length; i++) {
      if (mask & (1 << i)) generic += splittable[i].altGeneric
      else pips.push(splittable[i])
    }

    if (total < generic + pips.length) continue
    if (!matchesAllPips(pool, pips)) continue

    const spare = total - (generic + pips.length)
    if (!ok || spare > maxX) maxX = spare
    ok = true
  }

  return { ok, maxX: ok ? maxX : 0 }
}

export function canPay(pool, cost) {
  return evaluate(pool, cost).ok
}

// Parsed costs per face. Multi-face cards carry "{W} // {1}{W}" at the top level, so the
// faces array is authoritative whenever it exists.
export function cardFaceCosts(card) {
  if (Array.isArray(card.faces) && card.faces.length > 0) {
    return card.faces.map(f => ({ name: f.name, cost: parseManaCost(f.manaCost) }))
  }
  return [{ name: card.name, cost: parseManaCost(card.manaCost) }]
}

// A card is castable iff ANY face is. The grid badges which half.
export function evaluateCard(pool, faceCosts) {
  const faces = faceCosts.map(f => {
    const result = evaluate(pool, f.cost)
    return { name: f.name, ok: result.ok, maxX: result.maxX, hasX: Boolean(f.cost?.hasX) }
  })
  const castable = faces.filter(f => f.ok)
  return {
    ok: castable.length > 0,
    maxX: castable.reduce((max, f) => Math.max(max, f.maxX), 0),
    faces,
  }
}
