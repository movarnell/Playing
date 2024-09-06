import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import Player from './components/Player'
import Enemy from './components/Enemy'
import Bullet from './components/Bullet'
import Explosion from './components/Explosion'

function App() {
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [playerPosition, setPlayerPosition] = useState({ x: screenSize.width / 2, y: screenSize.height - 100 })
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0 })
  const [playerHealth, setPlayerHealth] = useState(100)
  const [enemies, setEnemies] = useState([])
  const [bullets, setBullets] = useState([])
  const [enemyBullets, setEnemyBullets] = useState([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [keysPressed, setKeysPressed] = useState({})
  const [explosions, setExplosions] = useState([])
  const [enemyId, setEnemyId] = useState(0)
  const [bulletId, setBulletId] = useState(0)
  const [explosionId, setExplosionId] = useState(0)

  const PLAYER_SPEED = 3
  const MAX_VELOCITY = 10 // Increased for smoother continuous movement
  const ACCELERATION = 0.5 // Increased for faster acceleration
  const MOVING_FRICTION = 0.98 // Less friction when moving
  const STOPPING_FRICTION = 0.85 // More friction when stopping

  // Add refs for audio elements
  const shootSound = useRef(new Audio('/sounds/shoot.mp3'))
  const explosionSound = useRef(new Audio('/sounds/explosion.mp3'))
  const gameOverSound = useRef(new Audio('/sounds/game-over.mp3'))

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleKeyDown = useCallback((e) => {
    setKeysPressed(prev => ({ ...prev, [e.key]: true }))
  }, [])

  const handleKeyUp = useCallback((e) => {
    setKeysPressed(prev => ({ ...prev, [e.key]: false }))
    if (e.key === ' ') {
      setBullets(prev => [...prev, { id: bulletId, x: playerPosition.x + 15, y: playerPosition.y }])
      setBulletId(prev => prev + 1)
      shootSound.current.currentTime = 0
      shootSound.current.play()
    }
  }, [playerPosition, bulletId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const checkCollisions = useCallback(() => {
    let enemiesDestroyed = 0;
    let bulletsToRemove = new Set();

    setEnemies(prev => {
      return prev.filter(enemy => {
        const hitByBullet = bullets.find(bullet =>
          bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width &&
          bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height
        );
        if (hitByBullet) {
          enemiesDestroyed++;
          bulletsToRemove.add(hitByBullet.id);
          setExplosions(prevExplosions => {
            setExplosionId(prevId => prevId + 1);
            explosionSound.current.currentTime = 0;
            explosionSound.current.play();
            return [
              ...prevExplosions,
              {
                id: `explosion-${explosionId}`,
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2
              }
            ];
          });
          return false; // Remove the enemy
        }
        return true; // Keep the enemy
      });
    });

    // Update score
    setScore(score => score + enemiesDestroyed * 10);

    // Remove bullets that hit enemies
    setBullets(prev => prev.filter(bullet => !bulletsToRemove.has(bullet.id)));

    return enemiesDestroyed;
  }, [bullets, explosionId])

  useEffect(() => {
    if (!gameOver) {
      const gameLoop = setInterval(() => {
        // Update player velocity based on keys pressed
        setPlayerVelocity(prev => {
          let newVelocity = { ...prev }
          let isMoving = false

          if (keysPressed['ArrowLeft']) {
            newVelocity.x -= ACCELERATION
            isMoving = true
          }
          if (keysPressed['ArrowRight']) {
            newVelocity.x += ACCELERATION
            isMoving = true
          }
          if (keysPressed['ArrowUp']) {
            newVelocity.y -= ACCELERATION
            isMoving = true
          }
          if (keysPressed['ArrowDown']) {
            newVelocity.y += ACCELERATION
            isMoving = true
          }

          // Apply max velocity
          newVelocity.x = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVelocity.x))
          newVelocity.y = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVelocity.y))

          // Apply appropriate friction
          const frictionFactor = isMoving ? MOVING_FRICTION : STOPPING_FRICTION
          newVelocity.x *= frictionFactor
          newVelocity.y *= frictionFactor

          // If velocity is very small, set it to 0 to prevent drifting
          if (Math.abs(newVelocity.x) < 0.01) newVelocity.x = 0
          if (Math.abs(newVelocity.y) < 0.01) newVelocity.y = 0

          return newVelocity
        })

        // Update player position based on velocity
        setPlayerPosition(prev => ({
          x: Math.max(0, Math.min(screenSize.width - 30, prev.x + playerVelocity.x * PLAYER_SPEED)),
          y: Math.max(0, Math.min(screenSize.height - 50, prev.y + playerVelocity.y * PLAYER_SPEED))
        }))

        // Move player bullets
        setBullets(prev => prev.map(bullet => ({ ...bullet, y: bullet.y - 7 })).filter(bullet => bullet.y > 0))

        // Move enemy bullets
        setEnemyBullets(prev => prev.map(bullet => ({ ...bullet, y: bullet.y + 5 })).filter(bullet => bullet.y < screenSize.height))

        // Move enemies
        setEnemies(prev => prev.map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed,
          x: enemy.x + Math.sin(enemy.y / 30) * 2
        })).filter(enemy => enemy.y < screenSize.height))

        // Add new enemies
        if (Math.random() < 0.02) {
          setEnemies(prev => [...prev, {
            id: enemyId,
            x: Math.random() * (screenSize.width - 50),
            y: 0,
            speed: Math.random() * 2 + 1,
            width: 50,
            height: 50
          }])
          setEnemyId(prev => prev + 1)
        }

        // Enemy shooting
        setEnemyBullets(prev => {
          const newBullets = [...prev];
          enemies.forEach(enemy => {
            if (Math.random() < 0.005) {
              newBullets.push({ id: bulletId + newBullets.length, x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height });
            }
          });
          setBulletId(prev => prev + newBullets.length)
          return newBullets;
        });

        checkCollisions();

        // Check player hit
        const playerHit = enemyBullets.some(bullet =>
          bullet.x >= playerPosition.x && bullet.x <= playerPosition.x + 30 &&
          bullet.y >= playerPosition.y && bullet.y <= playerPosition.y + 30
        )
        if (playerHit) {
          setPlayerHealth(prev => {
            const newHealth = Math.max(0, prev - 10);
            if (newHealth <= 0) {
              setGameOver(true);
              gameOverSound.current.play()
            }
            return newHealth;
          })
        }

        // Move and update explosions
        setExplosions(prev => prev.map(explosion => ({
          ...explosion,
          y: explosion.y + 1 // Move explosion downward
        })).filter(explosion => explosion.y < screenSize.height))

      }, 1000 / 60) // 60 FPS

      return () => clearInterval(gameLoop)
    }
  }, [bullets, enemies, enemyBullets, playerPosition, playerHealth, gameOver, screenSize, playerVelocity, keysPressed, checkCollisions, explosions, enemyId, bulletId, explosionId])

  const restartGame = () => {
    setPlayerPosition({ x: screenSize.width / 2, y: screenSize.height - 100 })
    setPlayerHealth(100)
    setEnemies([])
    setBullets([])
    setEnemyBullets([])
    setScore(0)
    setGameOver(false)
    gameOverSound.current.pause()
    gameOverSound.current.currentTime = 0
  }

  return (
    <div className="game-container" style={{ width: screenSize.width, height: screenSize.height }}>
      {!gameOver ? (
        <>
          <Player position={playerPosition} health={playerHealth} />
          {enemies.map((enemy) => (
            <Enemy key={enemy.id} position={enemy} />
          ))}
          {bullets.map((bullet) => (
            <Bullet key={`p${bullet.id}`} position={bullet} playerBullet />
          ))}
          {enemyBullets.map((bullet) => (
            <Bullet key={`e${bullet.id}`} position={bullet} />
          ))}
          {explosions.map(explosion => (
            <Explosion
              key={explosion.id}
              position={{ x: explosion.x, y: explosion.y }}
              onAnimationComplete={() => setExplosions(prev => prev.filter(e => e.id !== explosion.id))}
            />
          ))}
          <div className="score">Score: {score}</div>
          <div className="health">Health: {playerHealth}</div>
        </>
      ) : (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Your score: {score}</p>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}
    </div>
  )
}

export default App
