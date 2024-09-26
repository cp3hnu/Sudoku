/**
 * 判断是否是超集
 *
 * @param {Set} set - The set to check.
 * @param {Set} subset - The subset to check against.
 * @return {boolean} True if the set is a superset of the subset, false otherwise.
 */
export function isSuperset(set, subset) {
  return subset.every((value) => set.has(value));
}

/**
 * 返回两个集合的并集
 *
 * @param {Set} setA - The first set to union.
 * @param {Set} setB - The second set to union.
 * @return {Set} A new set containing all elements from both setA and setB.
 */
export function union(setA, setB) {
  return new Set([...setA, ...setB]);
}

/**
 * 返回两个集合的交集
 *
 * @param {Set} setA - The first set to intersect.
 * @param {Set} setB - The second set to intersect.
 * @return {Set} A new set containing the intersection of setA and setB.
 */
export function intersection(setA, setB) {
  return new Set([...setA].filter((x) => setB.has(x)));
}

/**
 * 返回两个集合的差集
 *
 * @param {Set} setA - The first set.
 * @param {Set} setB - The second set.
 * @return {Set} A new set containing the difference of setA and setB.
 */
export function difference(setA, setB) {
  return new Set([...setA].filter((x) => !setB.has(x)));
}

/**
 * 返回两个集合的对称差
 *
 * @param {Set} setA - The first set.
 * @param {Set} setB - The second set.
 * @return {Set} A new set containing the symmetric difference of setA and setB.
 */
export function symmetricDifference(setA, setB) {
  return new Set(
    [...setA, ...setB].filter((x) => !setA.has(x) || !setB.has(x))
  );
}
