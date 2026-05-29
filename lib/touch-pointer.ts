type TouchPoint = { clientX: number; clientY: number }

/** Build a minimal mouse-like event from touch coordinates for shared handlers. */
export function touchToMouseLike(
  touch: TouchPoint,
  target: EventTarget
): React.MouseEvent {
  return {
    clientX: touch.clientX,
    clientY: touch.clientY,
    button: 0,
    target,
    preventDefault: () => {},
    stopPropagation: () => {},
  } as unknown as React.MouseEvent
}

export function touchDistance(t1: TouchPoint, t2: TouchPoint) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}
