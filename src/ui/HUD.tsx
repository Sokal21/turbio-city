import { useGameStore } from '../store';
import resourcesBarBg from '../assets/ui/hud/resources_bar.png';
import { GameControls } from './GameControls';

export function HUD() {
  const money = useGameStore((state) => state.resources.money);
  const bullets = useGameStore((state) => state.resources.bullets);
  const tick = useGameStore((state) => state.tick);
  const globalHeat = useGameStore((state) => state.heat);
  const unitHeat = useGameStore((state) => state.getTotalHeat());
  const totalHeat = globalHeat + unitHeat;
  const deficitTicks = useGameStore((state) => state.deficitTicks);
  const speed = useGameStore((state) => state.speed);
  const cycleSpeed = useGameStore((state) => state.cycleSpeed);

  const ticksUntilDesertion = 60 - deficitTicks;

  return (
    <div style={styles.container}>
      {/* Money indicator - adjust top/left to position */}
      <div style={styles.moneyIndicator}>
        <span style={styles.value}>${money.toLocaleString()}</span>
      </div>

      {/* Bullets indicator - adjust top/left to position */}
      <div style={styles.bulletsIndicator}>
        <span style={styles.value}>*{bullets.toLocaleString()}</span>
      </div>

      {/* Heat indicator - adjust top/left to position */}
      {totalHeat > 0 && (
        <div style={styles.heatIndicator}>
          <span style={styles.value}>{totalHeat}</span>
        </div>
      )}

      {/* Deficit indicator */}
      {deficitTicks > 0 && (
        <div style={styles.deficitIndicator}>
          <span style={styles.deficitIcon}>!</span>
          <span style={styles.deficitValue}>{ticksUntilDesertion}</span>
        </div>
      )}

      {/* Right section - speed & tick */}
      <div style={styles.rightSection}>
        <button style={styles.speedButton} onClick={cycleSpeed}>
          x{speed}
        </button>
        <div style={styles.tick}>
          Tick: {tick}
        </div>
        <GameControls />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    backgroundImage: `url(${resourcesBarBg})`,
    backgroundSize: 'auto 100%',
    backgroundPosition: 'left center',
    backgroundRepeat: 'no-repeat',
    borderRadius: '8px',
    height: '120px',
    width: '100%',
    backgroundColor: '#0C0F13',
  },
  // Adjust these top/left values to position on background
  moneyIndicator: {
    position: 'absolute',
    top: '38px',
    left: '160px',
  },
  bulletsIndicator: {
    position: 'absolute',
    top: '38px',
    left: '365px',
  },
  heatIndicator: {
    position: 'absolute',
    top: '38px',
    left: '590px',
  },
  deficitIndicator: {
    position: 'absolute',
    top: '40px',
    left: '420px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  value: {
    fontSize: '28px',
    color: '#fff',
  },
  heatValue: {
    fontSize: '28px',
    color: '#fc8181',
  },
  deficitIcon: {
    fontSize: '24px',
    color: '#fbd38d',
    backgroundColor: '#744210',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  deficitValue: {
    fontSize: '28px',
    color: '#fbd38d',
  },
  rightSection: {
    position: 'absolute',
    top: '40px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  speedButton: {
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4a5568',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tick: {
    fontSize: '14px',
    color: '#a0aec0',
  },
};
