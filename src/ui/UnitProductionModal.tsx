import { useGameStore } from '../store';
import { getBuildingDefinition, getBuildingLevelData } from '../game/buildings';
import { getUnitDefinition, getUnitLevelStats, type UnitDefinition, type UnitLevelStats } from '../game/units';
import type { Units } from '../game/units/definitions';

export function UnitProductionModal() {
  const productionModal = useGameStore((state) => state.productionModal);
  const closeProductionModal = useGameStore((state) => state.closeProductionModal);
  const getBuildingById = useGameStore((state) => state.getBuildingById);
  const queueUnitProduction = useGameStore((state) => state.queueUnitProduction);
  const cancelProduction = useGameStore((state) => state.cancelProduction);
  const resources = useGameStore((state) => state.resources);
  const canAfford = useGameStore((state) => state.canAfford);

  // Re-read building state to get live queue updates
  const buildings = useGameStore((state) => state.buildings);

  if (!productionModal.isOpen || !productionModal.buildingId) {
    return null;
  }

  const building = getBuildingById(productionModal.buildingId);
  if (!building) {
    return null;
  }

  const definition = getBuildingDefinition(building.type);
  const levelData = getBuildingLevelData(building.type, building.level);

  if (!levelData?.produces) {
    return null;
  }

  // Get all producible units with their levels
  const producibleUnits: Array<{
    unitType: keyof Units;
    unitLevel: number;
    unitDef: UnitDefinition;
    stats: UnitLevelStats;
  }> = [];

  for (const prod of levelData.produces) {
    const unitDef = getUnitDefinition(prod.unit);
    for (let lvl = 1; lvl <= prod.maxUnitLevel; lvl++) {
      const stats = getUnitLevelStats(prod.unit, lvl);
      if (stats && unitDef) {
        producibleUnits.push({
          unitType: prod.unit,
          unitLevel: lvl,
          unitDef,
          stats,
        });
      }
    }
  }

  const handleProduce = (unitType: keyof Units, unitLevel: number) => {
    queueUnitProduction(productionModal.buildingId!, unitType, unitLevel);
  };

  const handleCancelQueueItem = (index: number) => {
    cancelProduction(productionModal.buildingId!, index);
  };

  const handleClose = () => {
    closeProductionModal();
  };

  // Get live building state for queue
  const liveBuilding = buildings[productionModal.buildingId];
  const queue = liveBuilding?.productionQueue || [];

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{definition.name}</h2>
          <span style={styles.levelBadge}>Nivel {building.level}</span>
          <button style={styles.closeButton} onClick={handleClose}>
            &times;
          </button>
        </div>

        {/* Production Queue */}
        {queue.length > 0 && (
          <div style={styles.queueSection}>
            <h3 style={styles.sectionTitle}>Cola de Produccion ({queue.length})</h3>
            <div style={styles.queueList}>
              {queue.map((item, index) => {
                const unitDef = getUnitDefinition(item.unitType);
                const progress = Math.round((item.progress / item.total) * 100);
                const isFirst = index === 0;

                return (
                  <div key={index} style={styles.queueItem}>
                    <div style={styles.queueItemInfo}>
                      <span style={styles.queueItemName}>
                        {unitDef.name} Nv.{item.unitLevel}
                      </span>
                      {isFirst ? (
                        <div style={styles.progressContainer}>
                          <div
                            style={{
                              ...styles.progressBar,
                              width: `${progress}%`,
                            }}
                          />
                          <span style={styles.progressText}>
                            {item.progress}/{item.total}
                          </span>
                        </div>
                      ) : (
                        <span style={styles.queuePosition}>En cola</span>
                      )}
                    </div>
                    <button
                      style={styles.cancelQueueButton}
                      onClick={() => handleCancelQueueItem(index)}
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Units */}
        <div style={styles.unitsSection}>
          <h3 style={styles.sectionTitle}>Unidades Disponibles</h3>
          <div style={styles.unitList}>
            {producibleUnits.map(({ unitType, unitLevel, unitDef, stats }) => {
              const affordable = canAfford(stats.cost.money || 0, stats.cost.bullets || 0);

              return (
                <div
                  key={`${unitType}-${unitLevel}`}
                  style={{
                    ...styles.unitCard,
                    ...(affordable ? {} : styles.unitCardDisabled),
                  }}
                  onClick={() => affordable && handleProduce(unitType, unitLevel)}
                >
                  <div style={styles.unitHeader}>
                    <span style={styles.unitName}>{unitDef.name}</span>
                    <span style={styles.unitLevel}>Nv.{unitLevel}</span>
                  </div>

                  <div style={styles.unitStats}>
                    <span style={styles.stat}>ATK: {stats.attack}</span>
                    <span style={styles.stat}>DEF: {stats.defense}</span>
                    <span style={styles.stat}>SPD: {stats.speed}</span>
                  </div>

                  <div style={styles.unitCost}>
                    <span
                      style={{
                        ...styles.costValue,
                        color: resources.money >= (stats.cost.money || 0) ? '#68d391' : '#fc8181',
                      }}
                    >
                      ${stats.cost.money || 0}
                    </span>
                    <span style={styles.timeValue}>
                      {stats.buildTime}s
                    </span>
                  </div>

                  <div style={styles.unitUpkeep}>
                    <span style={styles.upkeepLabel}>Consumo:</span>
                    <span style={styles.upkeepValue}>
                      {stats.upkeep.bullets || 0} balas/tick
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button style={styles.closeButtonBottom} onClick={handleClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#2d3748',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '450px',
    maxWidth: '550px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  levelBadge: {
    backgroundColor: '#805ad5',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  closeButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 4px',
  },
  queueSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#4a5568',
    borderRadius: '8px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#2d3748',
    borderRadius: '6px',
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '4px',
  },
  progressContainer: {
    position: 'relative',
    height: '16px',
    backgroundColor: '#1a202c',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#805ad5',
    transition: 'width 0.3s ease',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    textShadow: '0 0 2px #000',
  },
  queuePosition: {
    color: '#a0aec0',
    fontSize: '12px',
  },
  cancelQueueButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#742a2a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  unitsSection: {
    marginBottom: '20px',
  },
  unitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  unitCard: {
    backgroundColor: '#4a5568',
    borderRadius: '8px',
    padding: '14px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  unitCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  unitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  unitName: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  unitLevel: {
    backgroundColor: '#553c9a',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  unitStats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px',
  },
  stat: {
    color: '#cbd5e0',
    fontSize: '13px',
  },
  unitCost: {
    display: 'flex',
    gap: '16px',
    marginBottom: '4px',
  },
  costValue: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  timeValue: {
    color: '#a0aec0',
    fontSize: '13px',
  },
  unitUpkeep: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  upkeepLabel: {
    color: '#a0aec0',
    fontSize: '12px',
  },
  upkeepValue: {
    color: '#fc8181',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  closeButtonBottom: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#4a5568',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
