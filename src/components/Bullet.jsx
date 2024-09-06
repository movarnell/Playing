import React from 'react'

const Bullet = ({ position, playerBullet }) => {
  return (
    <div className={`bullet ${playerBullet ? 'player-bullet' : 'enemy-bullet'}`} style={{ left: position.x, top: position.y }}>
      •
    </div>
  )
}

export default Bullet