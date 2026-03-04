import { useGameStore } from '../store';

export function HUD() {
  const money = useGameStore((state) => state.resources.money);
  const bullets = useGameStore((state) => state.resources.bullets);
  const tick = useGameStore((state) => state.tick);

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
  value: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  tick: {
    fontSize: '14px',
    color: '#a0aec0',
    marginLeft: 'auto',
  },
};
