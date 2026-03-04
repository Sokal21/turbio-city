import { useGameStore } from '../store';
import { getAllBuildingDefinitions, getBuildingLevelData } from '../game';
import type { BuildingDefinition } from '../store';

export function BuildMenu() {
  const resources = useGameStore((state) => state.resources);
  const placementMode = useGameStore((state) => state.placementMode);
  const enterPlacementMode = useGameStore((state) => state.enterPlacementMode);
  const exitPlacementMode = useGameStore((state) => state.exitPlacementMode);
  const canAfford = useGameStore((state) => state.canAfford);

  const buildings = getAllBuildingDefinitions();
  const isInPlacementMode = placementMode?.active ?? false;

  const handleSelectBuilding = (building: BuildingDefinition) => {
    const moneyCost = building.baseCost.money ?? 0;
    const bulletsCost = building.baseCost.bullets ?? 0;
    if (canAfford(moneyCost, bulletsCost)) {
      enterPlacementMode(building.type);
    }
  };

  const handleCancel = () => {
    exitPlacementMode();
  };

  // Get level 1 data for display
  const getLevel1Data = (building: BuildingDefinition) => {
    return getBuildingLevelData(building.type, 1);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Construcciones</h3>

      {isInPlacementMode && (
        <div style={styles.placementInfo}>
          <p style={styles.placementText}>
            Colocando: {placementMode?.buildingType}
          </p>
          <button style={styles.cancelButton} onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      )}

      <div style={styles.buildingList}>
        {buildings.map((building) => {
          const moneyCost = building.baseCost.money ?? 0;
          const bulletsCost = building.baseCost.bullets ?? 0;
          const affordable = canAfford(moneyCost, bulletsCost);
          const isSelected = placementMode?.buildingType === building.type;
          const level1Data = getLevel1Data(building);

          return (
            <div
              key={building.type}
              style={{
                ...styles.buildingCard,
                ...(isSelected ? styles.buildingCardSelected : {}),
                ...(!affordable ? styles.buildingCardDisabled : {}),
              }}
              onClick={() => !isSelected && handleSelectBuilding(building)}
            >
              <div style={styles.buildingHeader}>
                <span style={styles.buildingName}>{building.name}</span>
                <span style={styles.buildingSize}>
                  {building.size.width}x{building.size.height}
                </span>
              </div>

              <p style={styles.buildingDescription}>{building.description}</p>

              <div style={styles.buildingCost}>
                <span style={{
                  ...styles.costItem,
                  color: resources.money >= moneyCost ? '#68d391' : '#fc8181'
                }}>
                  ${moneyCost}
                </span>
                {bulletsCost > 0 && (
                  <span style={{
                    ...styles.costItem,
                    color: resources.bullets >= bulletsCost ? '#68d391' : '#fc8181'
                  }}>
                    {bulletsCost} balas
                  </span>
                )}
              </div>

              <div style={styles.buildingStats}>
                <span style={styles.statItem}>
                  Tiempo: {building.buildTime}s
                </span>
                {building.category === 'resources' && level1Data?.production && (
                  <span style={styles.statItem}>
                    +{level1Data.production.money ?? 0}$/tick
                    {level1Data.production.bullets ? ` +${level1Data.production.bullets} balas/tick` : ''}
                  </span>
                )}
                {building.category === 'units' && (
                  <span style={styles.statItem}>
                    Produce unidades
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    padding: '16px',
    minWidth: '250px',
  },
  title: {
    margin: '0 0 16px 0',
    color: '#fff',
    fontSize: '16px',
    borderBottom: '1px solid #4a5568',
    paddingBottom: '8px',
  },
  placementInfo: {
    backgroundColor: '#553c9a',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  placementText: {
    margin: '0 0 8px 0',
    color: '#fff',
    fontSize: '14px',
  },
  cancelButton: {
    padding: '6px 12px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#742a2a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buildingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  buildingCard: {
    backgroundColor: '#4a5568',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  buildingCardSelected: {
    borderColor: '#9f7aea',
    backgroundColor: '#553c9a',
  },
  buildingCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  buildingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  buildingName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  buildingSize: {
    color: '#a0aec0',
    fontSize: '12px',
  },
  buildingDescription: {
    color: '#cbd5e0',
    fontSize: '12px',
    margin: '0 0 8px 0',
  },
  buildingCost: {
    display: 'flex',
    gap: '12px',
    marginBottom: '4px',
  },
  costItem: {
    fontSize: '13px',
    fontWeight: 'bold',
  },
  buildingStats: {
    display: 'flex',
    gap: '12px',
  },
  statItem: {
    color: '#a0aec0',
    fontSize: '11px',
  },
};
