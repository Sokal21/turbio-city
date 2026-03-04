import { useGameStore } from '../store';

export function HUD() {
  const money = useGameStore((state) => state.resources.money);
  const bullets = useGameStore((state) => state.resources.bullets);
  const tick = useGameStore((state) => state.tick);
  const unitCount = useGameStore((state) => state.getUnitCount());
  const unitsInPool = useGameStore((state) => state.getUnitsInPool().length);
  const totalHeat = useGameStore((state) => state.getTotalHeat());

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
      <div style={styles.divider} />
      <div style={styles.resource}>
        <span style={styles.unitIcon}>S</span>
        <span style={styles.value}>
          {unitsInPool}
          {unitCount > unitsInPool && (
            <span style={styles.deployedCount}>/{unitCount}</span>
          )}
        </span>
      </div>
      {totalHeat > 0 && (
        <div style={styles.heat}>
          <span style={styles.heatIcon}>H</span>
          <span style={styles.heatValue}>{totalHeat}</span>
        </div>
      )}
      <div style={styles.tick}>
        Tick: {tick}
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
  unitIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#805ad5',
    backgroundColor: '#553c9a',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  value: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  deployedCount: {
    fontSize: '14px',
    color: '#a0aec0',
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
  tick: {
    fontSize: '14px',
    color: '#a0aec0',
    marginLeft: 'auto',
  },
};
