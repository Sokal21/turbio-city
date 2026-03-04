import { useGameStore } from '../store';
import { gameLoop } from '../game';

export function GameControls() {
  const paused = useGameStore((state) => state.paused);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);
  const resetGameLoop = useGameStore((state) => state.resetGameLoop);
  const resetResources = useGameStore((state) => state.resetResources);
  const resetBuildings = useGameStore((state) => state.resetBuildings);
  const resetMap = useGameStore((state) => state.resetMap);

  const handlePlayPause = () => {
    if (paused) {
      resume();
      if (!gameLoop.isRunning()) {
        gameLoop.start();
      }
    } else {
      pause();
    }
  };

  const handleReset = () => {
    gameLoop.stop();
    gameLoop.reset();
    resetGameLoop();
    resetResources();
    resetBuildings();
    resetMap();
  };

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={handlePlayPause}>
        {paused ? 'Play' : 'Pause'}
      </button>
      <button style={{ ...styles.button, ...styles.resetButton }} onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4a5568',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  resetButton: {
    backgroundColor: '#742a2a',
  },
};
