export const validateGrid = (array) => {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = array[r][c];
      if (value < 0 || value > 9) {
        return "只能输入数字 1~9";
      } else if (value > 0) {
        count += 1;
      }
    }
  }

  if (count < 17) {
    return "至少要确定17个数";
  }

  return undefined;
};
