// Parses a Scryfall mana_cost string into the shape the solver consumes.
//
//   parseManaCost('{2}{W}{W/U}') -> { generic: 2, pips: [{opts:['W']}, {opts:['W','U']}], hasX: false }
//
// Returns null when there is no castable cost at all ('' / null / undefined).
// '{0}' is a NON-EMPTY string and parses to { generic: 0, pips: [] } — castable with an
// empty pool. That distinction is the whole point of returning null only for the former.

const COLORS = new Set(['W', 'U', 'B', 'R', 'G'])

export function parseManaCost(str) {
  if (str === null || str === undefined || str === '') return null

  const cost = { generic: 0, pips: [], hasX: false }

  for (const match of String(str).matchAll(/\{([^}]*)\}/g)) {
    const sym = match[1].toUpperCase()

    if (/^\d+$/.test(sym)) {
      cost.generic += Number(sym)
      continue
    }

    if (sym === 'X' || sym === 'Y' || sym === 'Z') {
      cost.hasX = true                        // X counts as 0; spare mana is badged separately
      continue
    }

    if (sym === 'S') {
      cost.generic += 1                       // snow: over-permissive approximation, no snow source in the UI
      continue
    }

    if (COLORS.has(sym) || sym === 'C') {
      cost.pips.push({ opts: [sym] })
      continue
    }

    if (sym.includes('/')) {
      const parts = sym.split('/')

      // Phyrexian ({W/P}) is paid with 2 life, which isn't modelled — so it's free.
      // It must NOT become a pip: that would inflate pips.length and corrupt both the
      // generic rule and maxX.
      if (parts.includes('P')) continue

      // Generic-hybrid ({2/W}): payable by the colour, or by that many generic.
      const genericPart = parts.find(p => /^\d+$/.test(p))
      if (genericPart !== undefined) {
        const opts = parts.filter(p => COLORS.has(p) || p === 'C')
        cost.pips.push({ opts, altGeneric: Number(genericPart) })
        continue
      }

      const opts = parts.filter(p => COLORS.has(p) || p === 'C')
      if (opts.length > 0) cost.pips.push({ opts })
      continue
    }

    // Unknown symbol: treat as one generic rather than silently dropping it.
    cost.generic += 1
  }

  return cost
}
