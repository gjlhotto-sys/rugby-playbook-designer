import { useEffect, useState } from 'react'

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    // Check for actual touch screen, not just touch capability.
    // Many laptops report maxTouchPoints > 0, so use a media query
    // as the primary check. 'pointer: coarse' is true only on actual
    // touch-primary devices (phones, tablets) and false on desktop
    // mice/trackpads.
    const mq = window.matchMedia('(pointer: coarse)')
    setIsTouch(mq.matches)

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isTouch
}
