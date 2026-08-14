export default function SetPicker({ sets, activeSet, onSelect }) {
  return (
    <div className="set-picker">
      <label htmlFor="set-select">Set</label>
      <select id="set-select" value={activeSet} onChange={e => onSelect(e.target.value)}>
        {sets.map(s => (
          <option key={s.code} value={s.code}>
            {s.name} ({s.count})
          </option>
        ))}
      </select>
    </div>
  )
}
