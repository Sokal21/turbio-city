import { useEffect } from 'react';
import { GameCanvas } from './pixi';
import { HUD, GameControls, CellInfo, BuildMenu, ExpansionModal, UnitProductionModal, UnitPool } from './ui';
import {
  gameLoop,
  buildingsMiddleware,
  resourcesMiddleware,
  unitsMiddleware,
  aiMiddleware,
  attacksMiddleware,
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
    // Order matters:
    // 1. buildings - updates construction + unit production
    // 2. resources - calculates production, deducts upkeep, handles desertion
    // 3. units - placeholder for future unit logic
    // 4. ai - evaluates AI factions (police raids, etc.)
    // 5. attacks - countdown pending attacks, resolve combat
    // 6. eventsResolver - applies resource changes to state
    gameLoop
      .use(buildingsMiddleware)
      .use(resourcesMiddleware)
      .use(unitsMiddleware)
      .use(aiMiddleware)
      .use(attacksMiddleware)
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
        <div style={styles.mapSection}>
          <GameCanvas />
          <UnitPool />
        </div>
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
  mapSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default App;
