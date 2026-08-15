// Chips are derived from the loaded set, so a future set bringing Planeswalker or Battle
// just works. Clicking a chip isolates it; clicking the isolated chip again clears the
// group. An empty selection means "no constraint", so the grid can't be emptied.
function ChipGroup({ label, options, counts, selected, onToggle }) {
  const allOn = selected.length === 0
  return (
    <div className="chip-group">
      <span className="chip-group-label">{label}</span>
      {options.map(opt => {
        const count = counts[opt] || 0
        return (
          <button
            key={opt}
            className={`chip${allOn || selected.includes(opt) ? ' on' : ''}`}
            onClick={() => onToggle(opt)}
            disabled={count === 0}
          >
            {opt}
            <span className="chip-count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function FilterBar({
  types,
  typeCounts,
  selectedTypes,
  onToggleType,
  rarities,
  rarityCounts,
  selectedRarities,
  onToggleRarity,
  search,
  onSearchChange,
  resultCount,
  totalCount,
}) {
  return (
    <section className="filter-bar">
      <div className="filter-top">
        <input
          className="filter-search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search name or rules text"
          aria-label="Search name or rules text"
        />
        <span className="result-count">
          {resultCount} of {totalCount}
        </span>
      </div>

      <ChipGroup
        label="Type"
        options={types}
        counts={typeCounts}
        selected={selectedTypes}
        onToggle={onToggleType}
      />
      <ChipGroup
        label="Rarity"
        options={rarities}
        counts={rarityCounts}
        selected={selectedRarities}
        onToggle={onToggleRarity}
      />
    </section>
  )
}
