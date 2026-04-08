export const suspiciousPatterns = [
  /(\bOR\b|\bAND\b)\s+\d+=\d+/i,    // OR 1=1
  /UNION\s+SELECT/i,
  /DROP\s+TABLE/i,
  /--/,                            // SQL comment
  /;/,                             // multiple queries
];

export function isSuspicious(input) {
  return suspiciousPatterns.some((pattern) => pattern.test(input));
}
