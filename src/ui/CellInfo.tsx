import { useGameStore } from '../store';
import { getCell, getAdjacentCells } from '../pixi';

export function CellInfo() {
  const selectedCellId = useGameStore((state) => state.selectedCellId);

  if (!selectedCellId) {
    return (
      <div style={styles.container}>
        <p style={styles.placeholder}>Select a cell to see details</p>
      </div>
    );
  }

  const cell = getCell(selectedCellId);
  const adjacentCells = getAdjacentCells(selectedCellId);

  if (!cell) {
    return (
      <div style={styles.container}>
        <p style={styles.placeholder}>Cell not found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{cell.name || `Cell ${cell.id}`}</h3>
      <div style={styles.info}>
        <p><strong>Position:</strong> ({cell.x}, {cell.y})</p>
        <p><strong>Adjacent:</strong> {adjacentCells.length} cells</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    minWidth: '200px',
  },
  placeholder: {
    color: '#a0aec0',
    fontStyle: 'italic',
    margin: 0,
  },
  title: {
    color: '#fff',
    margin: '0 0 12px 0',
    fontSize: '18px',
  },
  info: {
    color: '#e2e8f0',
    fontSize: '14px',
  },
};
