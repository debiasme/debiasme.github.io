export function cleanBiasType(type) {
  return type
    .replace(/\s*Bias\s*Bias$/i, " Bias")
    .replace(/^Bias\s*Bias\s*/i, "Bias ")
    .replace(/\s+/g, " ")
    .trim();
}
