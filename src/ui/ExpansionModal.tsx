import { useGameStore } from '../store';
import { mapController } from '../game/map';
import type { ExpansionMethod } from '../game/map';

export function ExpansionModal() {
  const expansionModal = useGameStore((state) => state.expansionModal);
  const closeExpansionModal = useGameStore((state) => state.closeExpansionModal);
  const resources = useGameStore((state) => state.resources);

  if (!expansionModal.isOpen || !expansionModal.targetCellId) {
    return null;
  }

  const cellId = expansionModal.targetCellId;
  const cellInfo = mapController.getCellInfo(cellId);
  const cost = mapController.getExpansionCost(cellId);

  if (!cost || !cellInfo) {
    return null;
  }

  const canAffordPeaceful = resources.money >= cost.peaceful.money;
  const canAffordViolent =
    resources.money >= cost.violent.money &&
    resources.bullets >= cost.violent.bullets;

  const handleExpand = (method: ExpansionMethod) => {
    const result = mapController.expandToCell(cellId, method);
    if (result.success) {
      closeExpansionModal();
    } else {
      console.error('[ExpansionModal] Failed:', result.error);
    }
  };

  const handleClose = () => {
    closeExpansionModal();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Expandir Territorio</h2>
          <button style={styles.closeButton} onClick={handleClose}>
            &times;
          </button>
        </div>

        <div style={styles.cellName}>
          {cellInfo.name || `Celda ${cellId}`}
        </div>

        <div style={styles.options}>
          {/* Peaceful Option */}
          <div
            style={{
              ...styles.optionCard,
              ...(canAffordPeaceful ? {} : styles.optionDisabled),
            }}
            onClick={() => canAffordPeaceful && handleExpand('peaceful')}
          >
            <div style={styles.optionHeader}>
              <span style={styles.optionTitle}>Expansion Pacifica</span>
            </div>
            <p style={styles.optionDescription}>
              Compra el territorio a traves de negociaciones
            </p>
            <div style={styles.costRow}>
              <span
                style={{
                  ...styles.costValue,
                  color: canAffordPeaceful ? '#68d391' : '#fc8181',
                }}
              >
                ${cost.peaceful.money}
              </span>
            </div>
          </div>

          {/* Violent Option */}
          <div
            style={{
              ...styles.optionCard,
              ...styles.violentCard,
              ...(canAffordViolent ? {} : styles.optionDisabled),
            }}
            onClick={() => canAffordViolent && handleExpand('violent')}
          >
            <div style={styles.optionHeader}>
              <span style={styles.optionTitle}>Expansion Violenta</span>
              <span style={styles.heatBadge}>+{cost.violent.heat} heat</span>
            </div>
            <p style={styles.optionDescription}>
              Toma el territorio por la fuerza
            </p>
            <div style={styles.costRow}>
              <span
                style={{
                  ...styles.costValue,
                  color: resources.money >= cost.violent.money ? '#68d391' : '#fc8181',
                }}
              >
                ${cost.violent.money}
              </span>
              <span
                style={{
                  ...styles.costValue,
                  color: resources.bullets >= cost.violent.bullets ? '#68d391' : '#fc8181',
                }}
              >
                {cost.violent.bullets} balas
              </span>
            </div>
          </div>
        </div>

        <button style={styles.cancelButton} onClick={handleClose}>
          Cancelar
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
    minWidth: '400px',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 4px',
  },
  cellName: {
    color: '#68d391',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  optionCard: {
    backgroundColor: '#4a5568',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'border-color 0.15s, transform 0.1s',
  },
  violentCard: {
    backgroundColor: '#553c3c',
    borderColor: '#744242',
  },
  optionDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  optionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  optionTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  heatBadge: {
    backgroundColor: '#c53030',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  optionDescription: {
    color: '#cbd5e0',
    fontSize: '13px',
    margin: '0 0 12px 0',
  },
  costRow: {
    display: 'flex',
    gap: '16px',
  },
  costValue: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cancelButton: {
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
