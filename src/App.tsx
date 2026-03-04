import { useEffect } from 'react';
import { GameCanvas } from './pixi';
import { HUD, GameControls, CellInfo, BuildMenu, ExpansionModal, UnitProductionModal } from './ui';
import {
  gameLoop,
  buildingsMiddleware,
  resourcesMiddleware,
  unitsMiddleware,
  eventsResolverMiddleware,
} from './game';
import { getGameState } from './store';

// 3x3 starting cells centered at 5,5
const STARTING_CELLS = [
  '4,4', '5,4', '6,4',
  '4,5', '5,5', '6,5',
  '4,6', '5,6', '6,6',
];

function App() {
  useEffect(() => {
    // Initialize player's starting cells
    getGameState().initializePlayerCells(STARTING_CELLS);

    // Setup game loop with middlewares
    // Order matters: buildings first (updates construction + unit production),
    // then resources (checks active buildings), then units (upkeep/desertion)
    gameLoop
      .use(buildingsMiddleware)
      .use(resourcesMiddleware)
      .use(unitsMiddleware)
      .use(eventsResolverMiddleware)
      .markInitialized();

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
          <BuildMenu />
        </aside>
      </main>
      <ExpansionModal />
      <UnitProductionModal />
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
