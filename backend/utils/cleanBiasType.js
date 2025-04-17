export function cleanBiasType(biasType) {
  // Check if biasType is defined before using string methods
  if (!biasType) {
    return ""; // Return empty string or some default value
  }

  // Continue with the existing string operations
  return biasType
    .replace(/\s*Bias\s*Bias$/i, " Bias")
    .replace(/^Bias\s*Bias\s*/i, "Bias ")
    .replace(/\s+/g, " ")
    .trim();
}
