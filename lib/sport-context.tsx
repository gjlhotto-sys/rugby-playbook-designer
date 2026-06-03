'use client'

import { createContext, useContext, useState } from 'react'

export type Sport = 'rugby' | 'netball'

interface SportContextValue {
  sport: Sport
  setSport: (sport: Sport) => void
}

const SportContext = createContext<SportContextValue>({
  sport: 'rugby',
  setSport: () => {},
})

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sport, setSport] = useState<Sport>('rugby')

  const handleSetSport = (newSport: Sport) => {
    setSport(newSport)
    if (typeof window !== 'undefined') {
      localStorage.setItem('playforge-sport', newSport)
    }
  }

  return (
    <SportContext.Provider value={{ sport, setSport: handleSetSport }}>
      {children}
    </SportContext.Provider>
  )
}

export function useSport() {
  return useContext(SportContext)
}
