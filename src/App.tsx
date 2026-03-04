import { useEffect } from 'react';
import { GameCanvas } from './pixi';
import { HUD, GameControls, CellInfo } from './ui';
import { gameLoop, resourcesMiddleware, eventsResolverMiddleware } from './game';

function App() {
  useEffect(() => {
    // Setup game loop with middlewares
    gameLoop
      .use(resourcesMiddleware)
      .use(eventsResolverMiddleware);

    // Start the loop (it will wait for unpause)
    gameLoop.start();

    return () => {
      gameLoop.stop();
    };
  }, []);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Turbio City</h1>
        <HUD />
        <GameControls />
      </header>
      <main style={styles.main}>
        <GameCanvas />
        <aside style={styles.sidebar}>
          <CellInfo />
        </aside>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '16px 24px',
    borderBottom: '1px solid #4a5568',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#68d391',
  },
  main: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default App;
