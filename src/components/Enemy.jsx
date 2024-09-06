import React from 'react'

const Enemy = ({ position }) => {
  return (
    <div className="enemy" style={{
      left: position.x,
      top: position.y,
      width: position.width,
      height: position.height
    }}>
      <div className="enemy-ship">👾</div>
      <div className="health-bar" style={{ width: `${position.health * 5}%` }}></div>
    </div>
  )
}

export default Enemy