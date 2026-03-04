import { useMemo } from 'react';
import { useGameStore } from '../store';
import { getUnitDefinition } from '../game/units/definitions';
import type { Units } from '../game/units/definitions';

export function UnitPool() {
  const units = useGameStore((state) => state.units);

  const { unitsInPool, deployedCount } = useMemo(() => {
    const allUnits = Object.values(units);
    const inPool = allUnits.filter((u) => u.location === 'pool');
    return {
      unitsInPool: inPool,
      deployedCount: allUnits.length - inPool.length,
    };
  }, [units]);

  // Group units by type and level
  const grouped: Record<string, { type: keyof Units; level: number; count: number; emoji: string }> = {};

  for (const unit of unitsInPool) {
    const key = `${unit.type}_${unit.level}`;
    if (!grouped[key]) {
      const definition = getUnitDefinition(unit.type as keyof Units);
      grouped[key] = {
        type: unit.type as keyof Units,
        level: unit.level,
        count: 0,
        emoji: definition?.emoji || '?',
      };
    }
    grouped[key].count++;
  }

  const unitGroups = Object.values(grouped);

  if (unitGroups.length === 0 && deployedCount === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.units}>
        {unitGroups.map((group) => (
          <div key={`${group.type}_${group.level}`} style={styles.unitGroup}>
            <span style={styles.emoji}>{group.emoji}</span>
            <span style={styles.count}>x{group.count}</span>
            {group.level > 1 && <span style={styles.level}>Lv{group.level}</span>}
          </div>
        ))}
      </div>
      {deployedCount > 0 && (
        <div style={styles.deployed}>
          +{deployedCount} deployed
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 24px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
  },
  units: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  unitGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#4a5568',
    borderRadius: '6px',
  },
  emoji: {
    fontSize: '20px',
  },
  count: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  level: {
    fontSize: '12px',
    color: '#a0aec0',
    marginLeft: '4px',
  },
  deployed: {
    fontSize: '14px',
    color: '#a0aec0',
    fontStyle: 'italic',
  },
};
