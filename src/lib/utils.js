export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

export const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};

export function getStartRowAndColumn(row, column) {
  const startRow = Math.floor(row / 3) * 3;
  const startColumn = Math.floor(column / 3) * 3;
  return { startRow, startColumn };
}

export function getEndRowAndColumn(row, column) {
  const { startRow, startColumn } = getStartRowAndColumn(row, column);
  return { endRow: startRow + 2, endColumn: startColumn + 2 };
}
