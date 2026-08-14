import { useState } from 'react'
import {
  BASIC_KINDS,
  ALLIED_PAIRS,
  ENEMY_PAIRS,
  SOURCE_LABELS,
  SOURCE_TITLES,
  emptyPool,
  poolTotal,
} from '../lib/manaPool.js'
import { parsePoolText, formatPool } from '../lib/parsePoolText.js'
import ManaButton from './ManaButton.jsx'

const FLEXIBLE_KINDS = ['ANY', ...ALLIED_PAIRS, ...ENEMY_PAIRS]

export default function ManaPool({ pool, onPoolChange }) {
  // The pool object is the single source of truth; the text box holds its own draft.
  // Typing reparses the draft and leaves it exactly as typed; a stepper click
  // regenerates the draft from the new pool.
  const [draft, setDraft] = useState(() => formatPool(pool))
  const [unparsed, setUnparsed] = useState([])
  const [showFlexible, setShowFlexible] = useState(() => FLEXIBLE_KINDS.some(k => pool[k] > 0))

  const total = poolTotal(pool)
  const flexible = FLEXIBLE_KINDS.reduce((sum, k) => sum + pool[k], 0)

  function handleText(text) {
    setDraft(text)
    const parsed = parsePoolText(text)
    setUnparsed(parsed.unparsed)
    onPoolChange(parsed.pool)
  }

  function handleStep(kind, next) {
    const updated = { ...pool, [kind]: Math.max(0, next) }
    onPoolChange(updated)
    setDraft(formatPool(updated))
    setUnparsed([])
  }

  function handleClear() {
    onPoolChange(emptyPool())
    setDraft('')
    setUnparsed([])
  }

  function renderRow(kinds) {
    return kinds.map(kind => (
      <ManaButton
        key={kind}
        kind={kind}
        label={SOURCE_LABELS[kind]}
        title={SOURCE_TITLES[kind]}
        count={pool[kind]}
        onChange={handleStep}
      />
    ))
  }

  return (
    <section className="mana-pool">
      <div className="mana-pool-header">
        <h2>Your mana</h2>
        <button className="btn-clear" onClick={handleClear} disabled={total === 0}>
          Clear
        </button>
      </div>

      <div className="mana-row">
        {renderRow(BASIC_KINDS)}
        <span className="mana-divider" />
        {renderRow(['ANY', 'C'])}
      </div>

      <button
        className="flexible-toggle"
        onClick={() => setShowFlexible(v => !v)}
        aria-expanded={showFlexible}
      >
        {showFlexible ? '▾' : '▸'} Flexible sources
        {!showFlexible && flexible > 0 && <span className="flexible-badge">{flexible}</span>}
      </button>

      {showFlexible && (
        <div className="mana-pairs">
          <div className="mana-row">{renderRow(ALLIED_PAIRS)}</div>
          <div className="mana-row">{renderRow(ENEMY_PAIRS)}</div>
        </div>
      )}

      <input
        className="pool-text"
        value={draft}
        onChange={e => handleText(e.target.value)}
        placeholder="2 plains 1 swamp   ·   WWB   ·   2 w/u   ·   {W}{W}{B}"
        aria-label="Mana pool as text"
      />

      <div className="pool-summary">
        {total === 0 ? (
          <span className="pool-summary-empty">No mana — showing the whole set</span>
        ) : (
          <span>
            {total} source{total === 1 ? '' : 's'}
            {flexible > 0 && `, ${flexible} flexible`}
          </span>
        )}
        {unparsed.length > 0 && (
          <span className="pool-unparsed">didn&apos;t understand: {unparsed.join(', ')}</span>
        )}
      </div>
    </section>
  )
}
