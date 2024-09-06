import React from 'react'

const Player = ({ position, health }) => {
  return (
    <div className="player" style={{ left: position.x, top: position.y }}>
      <div className="player-ship">🚀</div>
      <div className="health-bar" style={{ width: `${health}%` }}></div>
    </div>
  )
}

export default Player