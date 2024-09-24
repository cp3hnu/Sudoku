export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

/**
 * Checks if two arrays are equal.
 *
 * @param {number[]} a - The first array to compare.
 * @param {number[]} b - The second array to compare.
 * @returns {boolean} True if the arrays are equal, false otherwise.
 */
export const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};

export function getGridStartRowColumn(row, column) {
  const startRow = Math.floor(row / 3) * 3;
  const startColumn = Math.floor(column / 3) * 3;
  return { startRow, startColumn };
}

export function getGridEndRowColumn(row, column) {
  const { startRow, startColumn } = getGridStartRowColumn(row, column);
  return { endRow: startRow + 2, endColumn: startColumn + 2 };
}
