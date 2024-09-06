import React, { useEffect, useState } from 'react'

const Particle = ({ x, y, color }) => {
  const [position, setPosition] = useState({ x, y })
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 1
    const lifetime = Math.random() * 500 + 500

    const animation = setInterval(() => {
      setPosition(prev => ({
        x: prev.x + Math.cos(angle) * speed,
        y: prev.y + Math.sin(angle) * speed + 0.5 // Add downward motion
      }))
      setOpacity(prev => prev - 0.02)
    }, 16)

    const cleanup = setTimeout(() => {
      clearInterval(animation)
    }, lifetime)

    return () => {
      clearInterval(animation)
      clearTimeout(cleanup)
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 2,
        height: 2,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: opacity
      }}
    />
  )
}

const Explosion = ({ position, onAnimationComplete }) => {
  const [size, setSize] = useState(10)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const colors = ['#FFA500', '#FF4500', '#FF6347', '#FF8C00', '#FFD700']
    const newParticles = Array.from({ length: 50 }, () => ({
      x: position.x,
      y: position.y,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
    setParticles(newParticles)

    const growthInterval = setInterval(() => {
      setSize(prevSize => {
        if (prevSize >= 100) {
          clearInterval(growthInterval)
          setTimeout(onAnimationComplete, 500) // Delay removal to allow particles to dissipate
          return prevSize
        }
        return prevSize + 5
      })
    }, 16)

    return () => clearInterval(growthInterval)
  }, [position, onAnimationComplete])

  return (
    <>
      <div
        className="explosion"
        style={{
          position: 'absolute',
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,165,0,0.8) 0%, rgba(255,0,0,0.8) 50%, rgba(255,0,0,0) 70%)',
          opacity: 1 - size / 100
        }}
      />
      {particles.map((particle, index) => (
        <Particle key={index} {...particle} />
      ))}
    </>
  )
}

export default Explosion