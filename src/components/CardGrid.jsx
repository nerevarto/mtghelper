import CardTile from './CardTile.jsx'

export default function CardGrid({ cards, results, onOpen, emptyMessage }) {
  if (cards.length === 0) {
    return <div className="card-grid-empty">{emptyMessage}</div>
  }

  return (
    <ul className="card-grid">
      {cards.map(card => (
        <CardTile key={card.id} card={card} result={results.get(card.id)} onOpen={onOpen} />
      ))}
    </ul>
  )
}
