export default function ManaButton({ kind, label, title, count, onChange }) {
  return (
    <div className={`mana-button${count > 0 ? ' active' : ''}`} title={title}>
      <button
        className="mana-step"
        onClick={() => onChange(kind, count - 1)}
        disabled={count === 0}
        aria-label={`Remove one ${title} source`}
      >
        −
      </button>
      <button
        className={`mana-symbol sym-${kind}`}
        onClick={() => onChange(kind, count + 1)}
        aria-label={`Add one ${title} source`}
      >
        <span className="mana-label">{label}</span>
        <span className="mana-count">{count}</span>
      </button>
      <button
        className="mana-step"
        onClick={() => onChange(kind, count + 1)}
        aria-label={`Add one ${title} source`}
      >
        +
      </button>
    </div>
  )
}
