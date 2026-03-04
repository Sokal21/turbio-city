import { useGameStore } from '../store';

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
      <div style={styles.resource}>
        <span style={styles.icon}>$</span>
        <span style={styles.value}>{money.toLocaleString()}</span>
      </div>
      <div style={styles.resource}>
        <span style={styles.icon}>*</span>
        <span style={styles.value}>{bullets.toLocaleString()}</span>
      </div>
      {totalHeat > 0 && (
        <>
          <div style={styles.divider} />
          <div style={styles.heat}>
            <span style={styles.heatIcon}>H</span>
            <span style={styles.heatValue}>{totalHeat}</span>
          </div>
        </>
      )}
      {deficitTicks > 0 && (
        <div style={styles.deficit}>
          <span style={styles.deficitIcon}>!</span>
          <span style={styles.deficitValue}>{ticksUntilDesertion}</span>
        </div>
      )}
      <div style={styles.rightSection}>
        <button style={styles.speedButton} onClick={cycleSpeed}>
          x{speed}
        </button>
        <div style={styles.tick}>
          Tick: {tick}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    padding: '12px 24px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    alignItems: 'center',
  },
  resource: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '20px',
    color: '#68d391',
  },
  value: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#4a5568',
  },
  heat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  heatIcon: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fc8181',
    backgroundColor: '#742a2a',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  heatValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fc8181',
    fontFamily: 'monospace',
  },
  deficit: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deficitIcon: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fbd38d',
    backgroundColor: '#744210',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  deficitValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fbd38d',
    fontFamily: 'monospace',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto',
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
