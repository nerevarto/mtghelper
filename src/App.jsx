import { useState, useMemo, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useCardSet } from './hooks/useCardSet.js'
import { SET_MANIFEST } from './data/sets/index.js'
import { emptyPool, poolTotal, normalizePool } from './lib/manaPool.js'
import { cardFaceCosts, evaluateCard } from './lib/solver.js'
import SetPicker from './components/SetPicker.jsx'
import ManaPool from './components/ManaPool.jsx'
import FilterBar from './components/FilterBar.jsx'
import CardGrid from './components/CardGrid.jsx'
import CardModal from './components/CardModal.jsx'
import './App.css'

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
const SUPERTYPES = new Set(['Basic', 'Legendary', 'Ongoing', 'Snow', 'World', 'Host', 'Elite'])

// Card types from every face, minus supertypes. Derived rather than hardcoded so a set
// bringing Planeswalker or Battle needs no code change.
function cardTypes(card) {
  const lines = card.faces ? card.faces.map(f => f.typeLine) : [card.typeLine]
  const types = new Set()
  for (const line of lines) {
    for (const half of line.split(' // ')) {
      for (const word of half.split('—')[0].trim().split(/\s+/)) {
        if (word && !SUPERTYPES.has(word)) types.add(word)
      }
    }
  }
  return [...types]
}

function searchText(card) {
  const faces = card.faces || []
  return [card.name, card.oracleText, ...faces.map(f => f.name), ...faces.map(f => f.oracleText)]
    .join('\n')
    .toLowerCase()
}

// [] means "all on". Toggling the last one off falls back to [], so unticking a whole
// group reads as "no constraint" instead of emptying the grid.
function toggleChip(selected, option, available) {
  const current = selected.length === 0 ? available : selected
  const next = current.includes(option)
    ? current.filter(o => o !== option)
    : [...current, option]
  return next.length === 0 || next.length === available.length ? [] : next
}

// Same idea as normalizePool: a filters object saved before a shape change degrades to
// defaults instead of throwing.
function normalizeFilters(stored) {
  return {
    types: Array.isArray(stored?.types) ? stored.types.filter(t => typeof t === 'string') : [],
    rarities: Array.isArray(stored?.rarities) ? stored.rarities.filter(r => typeof r === 'string') : [],
    search: typeof stored?.search === 'string' ? stored.search : '',
  }
}

function countBy(cards, keysOf) {
  const counts = {}
  for (const card of cards) {
    for (const key of keysOf(card)) counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export default function App() {
  const [storedSet, setActiveSet] = useLocalStorage('mtgh_activeSet_v1', SET_MANIFEST[0].code)
  const activeSet = SET_MANIFEST.some(s => s.code === storedSet) ? storedSet : SET_MANIFEST[0].code
  const [storedPool, setStoredPool] = useLocalStorage('mtgh_pool_v1', emptyPool())
  const [storedFilters, setFilters] = useLocalStorage('mtgh_filters_v1', {
    types: [],
    rarities: [],
    search: '',
  })
  const [openCard, setOpenCard] = useState(null)

  const { cards, loading, error } = useCardSet(activeSet)
  const pool = useMemo(() => normalizePool(storedPool), [storedPool])
  const filters = useMemo(() => normalizeFilters(storedFilters), [storedFilters])

  // Parsed costs depend only on the card data, so they survive every pool change.
  const faceCosts = useMemo(() => {
    const map = new Map()
    for (const card of cards || []) map.set(card.id, cardFaceCosts(card))
    return map
  }, [cards])

  const searchIndex = useMemo(() => {
    const map = new Map()
    for (const card of cards || []) map.set(card.id, searchText(card))
    return map
  }, [cards])

  const typesIndex = useMemo(() => {
    const map = new Map()
    for (const card of cards || []) map.set(card.id, cardTypes(card))
    return map
  }, [cards])

  // Everything narrows here, in order, before CardGrid sees an array.
  const view = useMemo(() => {
    const all = cards || []
    const results = new Map()

    // 1. Mana. An empty pool is an explicit bypass (decision 12) — the solver would
    //    correctly return nothing, but the grid doubles as a set browser.
    const noMana = poolTotal(pool) === 0
    const castable = []
    for (const card of all) {
      const result = evaluateCard(pool, faceCosts.get(card.id))
      results.set(card.id, result)
      if (noMana || result.ok) castable.push(card)
    }

    // 2. Text search across every face's name and rules text.
    const query = filters.search.trim().toLowerCase()
    const searched = query ? castable.filter(c => searchIndex.get(c.id).includes(query)) : castable

    // 3. Chip groups. Each group's counts are measured against everything except itself,
    //    so a count shows what ticking that chip would give you.
    const availableTypes = [...new Set(searched.flatMap(c => typesIndex.get(c.id)))].sort()
    const availableRarities = [...new Set(searched.map(c => c.rarity))].sort(
      (a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b),
    )

    const activeTypes = filters.types.filter(t => availableTypes.includes(t))
    const activeRarities = filters.rarities.filter(r => availableRarities.includes(r))
    const typeConstrained = activeTypes.length > 0 && activeTypes.length < availableTypes.length
    const rarityConstrained =
      activeRarities.length > 0 && activeRarities.length < availableRarities.length

    const byType = typeConstrained
      ? searched.filter(c => typesIndex.get(c.id).some(t => activeTypes.includes(t)))
      : searched
    const byRarity = rarityConstrained
      ? searched.filter(c => activeRarities.includes(c.rarity))
      : searched

    const rarityIds = new Set(byRarity.map(c => c.id))
    const filtered = typeConstrained ? byType.filter(c => rarityIds.has(c.id)) : byRarity

    // 4. Cheapest first — that matches the decision actually being made mid-game.
    const sorted = [...filtered].sort((a, b) => a.cmc - b.cmc || a.name.localeCompare(b.name))

    return {
      results,
      cards: sorted,
      total: all.length,
      types: availableTypes,
      rarities: availableRarities,
      typeCounts: countBy(byRarity, c => typesIndex.get(c.id)),
      rarityCounts: countBy(byType, c => [c.rarity]),
    }
  }, [cards, pool, filters, faceCosts, searchIndex, typesIndex])

  const handleToggleType = useCallback(
    option =>
      setFilters(f => {
        const current = normalizeFilters(f)
        return { ...current, types: toggleChip(current.types, option, view.types) }
      }),
    [setFilters, view.types],
  )
  const handleToggleRarity = useCallback(
    option =>
      setFilters(f => {
        const current = normalizeFilters(f)
        return { ...current, rarities: toggleChip(current.rarities, option, view.rarities) }
      }),
    [setFilters, view.rarities],
  )
  const handleSearch = useCallback(
    value => setFilters(f => ({ ...normalizeFilters(f), search: value })),
    [setFilters],
  )
  const handleSelectSet = useCallback(
    code => {
      setActiveSet(code)
      setOpenCard(null)
    },
    [setActiveSet],
  )

  const emptyMessage =
    poolTotal(pool) > 0 && view.total > 0
      ? 'No castable cards — try adding mana or clearing filters'
      : 'No cards match these filters'

  return (
    <div className="app">
      <header className="app-header">
        <h1>MTG Mana Helper</h1>
        <SetPicker sets={SET_MANIFEST} activeSet={activeSet} onSelect={handleSelectSet} />
      </header>

      <ManaPool pool={pool} onPoolChange={setStoredPool} />

      {error && <div className="app-error">Couldn&apos;t load that set: {error}</div>}

      {loading ? (
        <div className="app-loading">Loading cards…</div>
      ) : (
        <>
          <FilterBar
            types={view.types}
            typeCounts={view.typeCounts}
            selectedTypes={filters.types}
            onToggleType={handleToggleType}
            rarities={view.rarities}
            rarityCounts={view.rarityCounts}
            selectedRarities={filters.rarities}
            onToggleRarity={handleToggleRarity}
            search={filters.search}
            onSearchChange={handleSearch}
            resultCount={view.cards.length}
            totalCount={view.total}
          />

          <CardGrid
            cards={view.cards}
            results={view.results}
            onOpen={setOpenCard}
            emptyMessage={emptyMessage}
          />
        </>
      )}

      {openCard && (
        <CardModal
          card={openCard}
          result={view.results.get(openCard.id)}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}
