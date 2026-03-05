import { useMemo } from 'react';
import { useGameStore } from '../store';
import { getUnitDefinition } from '../game/units/definitions';
import type { Units } from '../game/units/definitions';

export function UnitPool() {
  const units = useGameStore((state) => state.units);
  const movementMode = useGameStore((state) => state.movementMode);
  const enterMovementMode = useGameStore((state) => state.enterMovementMode);
  const exitMovementMode = useGameStore((state) => state.exitMovementMode);
  const toggleUnitSelection = useGameStore((state) => state.toggleUnitSelection);

  const { unitsInPool, deployedCount, inTransitCount } = useMemo(() => {
    const allUnits = Object.values(units);
    const inPool = allUnits.filter((u) => u.location === 'pool');
    const inTransit = allUnits.filter((u) => u.location.startsWith('transit:'));
    const deployed = allUnits.length - inPool.length - inTransit.length;
    return {
      unitsInPool: inPool,
      deployedCount: deployed,
      inTransitCount: inTransit.length,
    };
  }, [units]);

  // Check if we're in pool deployment mode
  const isPoolMode = movementMode.active && movementMode.fromCellId === 'pool';

  // Group units by type and level
  const grouped: Record<string, { type: keyof Units; level: number; count: number; emoji: string; unitIds: string[] }> = {};

  for (const unit of unitsInPool) {
    const key = `${unit.type}_${unit.level}`;
    if (!grouped[key]) {
      const definition = getUnitDefinition(unit.type as keyof Units);
      grouped[key] = {
        type: unit.type as keyof Units,
        level: unit.level,
        count: 0,
        emoji: definition?.emoji || '?',
        unitIds: [],
      };
    }
    grouped[key].count++;
    grouped[key].unitIds.push(unit.id);
  }

  const unitGroups = Object.values(grouped);

  // Handle clicking a unit group
  const handleGroupClick = (group: typeof unitGroups[0]) => {
    if (isPoolMode) {
      // Toggle selection of all units in this group
      for (const unitId of group.unitIds) {
        toggleUnitSelection(unitId);
      }
    } else {
      // Enter deployment mode with all units in this group selected
      enterMovementMode('pool', group.unitIds);
    }
  };

  // Handle deploy all
  const handleDeployAll = () => {
    const allPoolUnitIds = unitsInPool.map((u) => u.id);
    enterMovementMode('pool', allPoolUnitIds);
  };

  if (unitGroups.length === 0 && deployedCount === 0 && inTransitCount === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      {isPoolMode ? (
        <>
          <div style={styles.modeLabel}>Select units to deploy, then click destination</div>
          <div style={styles.units}>
            {unitGroups.map((group) => {
              const selectedCount = group.unitIds.filter((id) =>
                movementMode.selectedUnitIds.includes(id)
              ).length;
              const isSelected = selectedCount > 0;
              return (
                <div
                  key={`${group.type}_${group.level}`}
                  style={{
                    ...styles.unitGroup,
                    ...(isSelected ? styles.unitGroupSelected : {}),
                    cursor: 'pointer',
                  }}
                  onClick={() => handleGroupClick(group)}
                >
                  <span style={styles.emoji}>{group.emoji}</span>
                  <span style={styles.count}>
                    {selectedCount > 0 ? `${selectedCount}/` : ''}x{group.count}
                  </span>
                  {group.level > 1 && <span style={styles.level}>Lv{group.level}</span>}
                </div>
              );
            })}
          </div>
          <button style={styles.cancelButton} onClick={exitMovementMode}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <div style={styles.units}>
            {unitGroups.map((group) => (
              <div
                key={`${group.type}_${group.level}`}
                style={{ ...styles.unitGroup, cursor: 'pointer' }}
                onClick={() => handleGroupClick(group)}
                title="Click to deploy"
              >
                <span style={styles.emoji}>{group.emoji}</span>
                <span style={styles.count}>x{group.count}</span>
                {group.level > 1 && <span style={styles.level}>Lv{group.level}</span>}
              </div>
            ))}
          </div>
          {unitsInPool.length > 0 && (
            <button style={styles.deployButton} onClick={handleDeployAll}>
              Deploy All
            </button>
          )}
          {(deployedCount > 0 || inTransitCount > 0) && (
            <div style={styles.deployed}>
              {deployedCount > 0 && `${deployedCount} deployed`}
              {deployedCount > 0 && inTransitCount > 0 && ', '}
              {inTransitCount > 0 && `${inTransitCount} moving`}
            </div>
          )}
        </>
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
    flexWrap: 'wrap',
  },
  modeLabel: {
    fontSize: '14px',
    color: '#9f7aea',
    fontWeight: 'bold',
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
  unitGroupSelected: {
    backgroundColor: '#805ad5',
    outline: '2px solid #9f7aea',
  },
  emoji: {
    fontSize: '20px',
  },
  count: {
    fontSize: '16px',
    color: '#fff',
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
  deployButton: {
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#805ad5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '6px 12px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#e53e3e',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
