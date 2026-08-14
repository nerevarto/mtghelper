import { useState, useEffect } from 'react'

// Set modules are code-split; Vite needs a static glob to know what to split.
const LOADERS = import.meta.glob(['../data/sets/*.js', '!../data/sets/index.js'])

const cache = new Map()

export function useCardSet(code) {
  const [cards, setCards] = useState(() => cache.get(code) ?? null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!code) return

    const cached = cache.get(code)
    if (cached) {
      setCards(cached)
      setError(null)
      return
    }

    const load = LOADERS[`../data/sets/${code}.js`]
    if (!load) {
      setCards(null)
      setError(`No data module for set "${code}"`)
      return
    }

    let stale = false
    setCards(null)
    setError(null)
    load().then(
      mod => {
        cache.set(code, mod.CARDS)
        if (!stale) setCards(mod.CARDS)
      },
      err => {
        if (!stale) setError(err.message)
      },
    )
    return () => { stale = true }
  }, [code])

  return { cards, loading: cards === null && error === null, error }
}
