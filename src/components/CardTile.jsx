import { useState } from 'react'

// A Scryfall CDN 404 or a null image falls back to a text-only tile rather than a broken
// image icon — the card is still castable, so it must stay visible.
export default function CardTile({ card, result, onOpen }) {
  const [broken, setBroken] = useState(false)
  const multiface = result.faces.length > 1
  const xFace = result.faces.find(f => f.ok && f.hasX)

  return (
    <li className="card-tile">
      <button className="card-tile-button" onClick={() => onOpen(card)} title={card.name}>
        {card.imgSmall && !broken ? (
          <img
            src={card.imgSmall}
            alt={card.name}
            loading="lazy"
            width="146"
            height="204"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="card-placeholder">
            <span className="placeholder-name">{card.name}</span>
            <span className="placeholder-cost">{card.manaCost}</span>
            <span className="placeholder-type">{card.typeLine}</span>
          </div>
        )}
      </button>

      {(multiface || xFace) && (
        <div className="card-badges">
          {multiface &&
            result.faces.map(face => (
              <span key={face.name} className={`badge face${face.ok ? ' castable' : ''}`}>
                {face.name}
              </span>
            ))}
          {xFace && <span className="badge badge-x">X ≤ {xFace.maxX}</span>}
        </div>
      )}
    </li>
  )
}
