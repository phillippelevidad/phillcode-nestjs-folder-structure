export function isObject(input: unknown): input is Record<string, unknown> {
  return input && typeof input === 'object' && !Array.isArray(input);
}
