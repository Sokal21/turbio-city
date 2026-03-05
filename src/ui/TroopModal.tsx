import { useMemo } from 'react';
import { useGameStore } from '../store';
import { getManhattanDistance, isInstantMovement } from '../store/slices/movementsSlice';
import { getUnitDefinition } from '../game/units/definitions';
import type { UnitInstance, Units } from '../game/units/definitions';

export function TroopModal() {
  const selectedCellId = useGameStore((state) => state.selectedCellId);
  const units = useGameStore((state) => state.units);
  const movementMode = useGameStore((state) => state.movementMode);
  const enterMovementMode = useGameStore((state) => state.enterMovementMode);
  const exitMovementMode = useGameStore((state) => state.exitMovementMode);
  const toggleUnitSelection = useGameStore((state) => state.toggleUnitSelection);
  const startMovement = useGameStore((state) => state.startMovement);
  const pendingMovements = useGameStore((state) => state.pendingMovements);

  // Get units at selected cell
  const unitsAtCell = useMemo(() => {
    if (!selectedCellId) return [];
    return Object.values(units).filter((u) => u.location === selectedCellId);
  }, [units, selectedCellId]);

  // Get incoming movements to this cell
  const incomingMovements = useMemo(() => {
    if (!selectedCellId) return [];
    return pendingMovements.filter((m) => m.toCellId === selectedCellId);
  }, [pendingMovements, selectedCellId]);

  // Handle starting movement mode
  const handleStartMove = () => {
    if (!selectedCellId || unitsAtCell.length === 0) return;
    // Select all units by default
    enterMovementMode(selectedCellId, unitsAtCell.map((u) => u.id));
  };

  // Handle confirming movement
  const handleConfirmMove = () => {
    if (!movementMode.active || !movementMode.fromCellId || !selectedCellId) return;
    if (movementMode.selectedUnitIds.length === 0) return;
    if (movementMode.fromCellId === selectedCellId) return;

    // Calculate movement time
    const selectedUnits = movementMode.selectedUnitIds
      .map((id) => units[id])
      .filter(Boolean) as UnitInstance[];

    if (selectedUnits.length === 0) return;

    const isFromPool = movementMode.fromCellId === 'pool';

    // Check if instant (pool deployment or movement within pool area)
    const instant = isFromPool || isInstantMovement(movementMode.fromCellId, selectedCellId);

    if (instant) {
      // Instant movement - move immediately
      for (const unit of selectedUnits) {
        useGameStore.getState().moveUnitToCell(unit.id, selectedCellId);
      }
    } else {
      // Calculate ticks based on slowest unit
      const distance = getManhattanDistance(movementMode.fromCellId, selectedCellId);
      const slowestSpeed = Math.max(...selectedUnits.map((u) => u.speed));
      const ticks = distance * slowestSpeed;

      startMovement(
        movementMode.selectedUnitIds,
        movementMode.fromCellId,
        selectedCellId,
        ticks
      );
    }

    exitMovementMode();
  };

  // If no cell selected, don't show
  if (!selectedCellId) return null;

  // If in movement mode and selecting destination (including from pool)
  const isSelectingDestination = movementMode.active &&
    (movementMode.fromCellId === 'pool' || movementMode.fromCellId !== selectedCellId);

  if (isSelectingDestination && movementMode.fromCellId !== selectedCellId) {
    const fromCell = movementMode.fromCellId!;
    const isFromPool = fromCell === 'pool';
    // For pool, use distance 0 (instant to starting area, or calculate from center)
    const distance = isFromPool ? 0 : getManhattanDistance(fromCell, selectedCellId);
    const selectedUnits = movementMode.selectedUnitIds
      .map((id) => units[id])
      .filter(Boolean) as UnitInstance[];
    const slowestSpeed = selectedUnits.length > 0 ? Math.max(...selectedUnits.map((u) => u.speed)) : 1;
    // Pool deployment is always instant (units spawn at destination from pool)
    const instant = isFromPool || isInstantMovement(fromCell, selectedCellId);
    const ticks = instant ? 0 : distance * slowestSpeed;

    return (
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Move to {selectedCellId}</h3>
          <button style={styles.closeButton} onClick={exitMovementMode}>×</button>
        </div>
        <div style={styles.content}>
          <p style={styles.info}>
            Moving {movementMode.selectedUnitIds.length} unit(s)
          </p>
          <p style={styles.info}>
            Distance: {distance} tiles
          </p>
          <p style={styles.info}>
            Time: {instant ? 'Instant' : `${ticks} ticks`}
          </p>
        </div>
        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={exitMovementMode}>
            Cancel
          </button>
          <button style={styles.confirmButton} onClick={handleConfirmMove}>
            Confirm Move
          </button>
        </div>
      </div>
    );
  }

  // If in movement mode and viewing source cell
  if (movementMode.active && movementMode.fromCellId === selectedCellId) {
    return (
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Select Units to Move</h3>
          <button style={styles.closeButton} onClick={exitMovementMode}>×</button>
        </div>
        <div style={styles.content}>
          <p style={styles.info}>Click units to select/deselect, then click destination cell</p>
          <div style={styles.unitList}>
            {unitsAtCell.map((unit) => {
              const def = getUnitDefinition(unit.type as keyof Units);
              const isSelected = movementMode.selectedUnitIds.includes(unit.id);
              return (
                <div
                  key={unit.id}
                  style={{
                    ...styles.unitItem,
                    ...(isSelected ? styles.unitItemSelected : {}),
                  }}
                  onClick={() => toggleUnitSelection(unit.id)}
                >
                  <span style={styles.unitEmoji}>{def?.emoji || '?'}</span>
                  <span style={styles.unitName}>
                    {def?.name || unit.type} Lv{unit.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={exitMovementMode}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Normal view - show units at cell
  if (unitsAtCell.length === 0 && incomingMovements.length === 0) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.header}>
        <h3 style={styles.title}>Troops at {selectedCellId}</h3>
      </div>
      <div style={styles.content}>
        {unitsAtCell.length > 0 && (
          <>
            <div style={styles.unitList}>
              {unitsAtCell.map((unit) => {
                const def = getUnitDefinition(unit.type as keyof Units);
                return (
                  <div key={unit.id} style={styles.unitItem}>
                    <span style={styles.unitEmoji}>{def?.emoji || '?'}</span>
                    <span style={styles.unitName}>
                      {def?.name || unit.type} Lv{unit.level}
                    </span>
                    <span style={styles.unitStats}>
                      ATK:{unit.attack} DEF:{unit.defense}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={styles.actions}>
              <button style={styles.moveButton} onClick={handleStartMove}>
                Move Units
              </button>
            </div>
          </>
        )}
        {incomingMovements.length > 0 && (
          <div style={styles.incomingSection}>
            <p style={styles.incomingTitle}>Incoming:</p>
            {incomingMovements.map((m) => (
              <p key={m.id} style={styles.incomingInfo}>
                {m.unitIds.length} unit(s) arriving in {m.ticksRemaining} ticks
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modal: {
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    padding: '16px',
    minWidth: '250px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    color: '#fff',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: '20px',
    cursor: 'pointer',
  },
  content: {
    marginBottom: '12px',
  },
  info: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#a0aec0',
  },
  unitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  unitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: '#4a5568',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  unitItemSelected: {
    backgroundColor: '#805ad5',
    outline: '2px solid #9f7aea',
  },
  unitEmoji: {
    fontSize: '20px',
  },
  unitName: {
    fontSize: '14px',
    color: '#fff',
    flex: 1,
  },
  unitStats: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  moveButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#805ad5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#4a5568',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#48bb78',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  incomingSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #4a5568',
  },
  incomingTitle: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#9f7aea',
  },
  incomingInfo: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#a0aec0',
  },
};
