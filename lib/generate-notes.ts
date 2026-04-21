export function generatePlayNotes(playData: {
  playType: string
  players: Array<{ number: number; abbr: string; team: string; x: number; y: number }>
  arrows: Array<{ playerId: string; arrowType: string; team: string }>
}): string {
  const attackArrows = playData.arrows.filter((a) => a.team === "attack")
  const passArrows = attackArrows.filter((a) => a.arrowType === "pass")
  const decoyArrows = attackArrows.filter((a) => a.arrowType === "decoy")
  const runArrows = attackArrows.filter((a) => a.arrowType === "run")
  const curveArrows = attackArrows.filter((a) => a.arrowType === "curve")
  const zArrows = attackArrows.filter((a) => a.arrowType === "z-left" || a.arrowType === "z-right")

  const getPlayerName = (playerId: string) => {
    const num = parseInt(playerId.split("-")[1], 10)
    const p = playData.players.find((player) => player.number === num)
    return p ? `#${p.number} (${p.abbr})` : playerId
  }
  void getPlayerName

  const lines: string[] = []

  const openers: Record<string, string> = {
    Lineout: `${playData.playType} play off our throw.`,
    Scrum: `${playData.playType} play off the base.`,
    "Backline Move": "Backline move from first phase.",
    "Kick-off": "Kick-off receive and attack.",
    Restart: "Restart receive - look to attack wide.",
    Penalty: "Quick tap penalty - exploit the advantage.",
    "Free Play": "Open play move.",
  }
  lines.push(openers[playData.playType] || "Set play.")

  if (passArrows.length > 0) {
    lines.push(`Ball is moved through ${passArrows.length} pass${passArrows.length > 1 ? "es" : ""} to advance through the channels.`)
  }

  if (runArrows.length > 0) {
    lines.push(`${runArrows.length} direct run line${runArrows.length > 1 ? "s" : ""} target the gain line.`)
  }

  if (decoyArrows.length > 0) {
    lines.push(`${decoyArrows.length} decoy runner${decoyArrows.length > 1 ? "s" : ""} pull the defensive line before the ball is released.`)
  }

  if (zArrows.length > 0) {
    lines.push(`${zArrows.length > 1 ? "Multiple cut" : "A cut"} move${zArrows.length > 1 ? "s" : ""} used to create space in behind the defensive line.`)
  }

  if (curveArrows.length > 0) {
    lines.push(`Arcing run${curveArrows.length > 1 ? "s" : ""} used to draw defenders and create overlap opportunities.`)
  }

  if (attackArrows.length === 0) {
    return `${openers[playData.playType] || "Set play."} Draw arrows on the field to generate movement notes.`
  }

  lines.push("Execute on the call word. All players hit their lines at full pace.")

  return lines.join(" ")
}
