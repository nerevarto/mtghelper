import { useState, useEffect } from 'react'

export default function CardModal({ card, result, onClose }) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [card])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const faces = card.faces || [
    { name: card.name, manaCost: card.manaCost, typeLine: card.typeLine, oracleText: card.oracleText },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={card.name}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {card.img && !broken && (
          <img className="modal-image" src={card.img} alt={card.name} onError={() => setBroken(true)} />
        )}

        <div className="modal-body">
          {faces.map((face, i) => {
            const faceResult = result?.faces[i]
            return (
              <div key={face.name} className={`modal-face${faceResult && !faceResult.ok ? ' uncastable' : ''}`}>
                <div className="modal-face-header">
                  <span className="modal-face-name">{face.name}</span>
                  <span className="modal-face-cost">{face.manaCost}</span>
                </div>
                <div className="modal-face-type">{face.typeLine}</div>
                {face.oracleText && <p className="modal-face-text">{face.oracleText}</p>}
                {faceResult && (
                  <div className="modal-face-status">
                    {faceResult.ok
                      ? `Castable${faceResult.hasX ? ` with X up to ${faceResult.maxX}` : ''}`
                      : 'Not castable with your mana'}
                  </div>
                )}
              </div>
            )
          })}
          <div className="modal-meta">
            {card.rarity} · #{card.number}
            {card.power !== undefined && ` · ${card.power}/${card.toughness}`}
          </div>
        </div>
      </div>
    </div>
  )
}
