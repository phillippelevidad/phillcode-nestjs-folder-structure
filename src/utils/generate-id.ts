import { Snowflake } from 'nodejs-snowflake';

const uid = new Snowflake();

export function generateId(): string {
  // Snowflake generates a unique ID as a BigInt. We cast it to a string for these reasons:

  // 1. BigInt can't be serialized directly in JSON (e.g., for API responses or JSON-based storage).
  //    E.g., JSON.stringify(897976876987897n) will throw an error.

  // 2. Using strings for IDs ensures they work safely across different systems and databases
  //    without issues like precision loss, especially with very large numbers.

  // 3. IDs aren't usually involved in math operations, so we don't require them as numbers in code,
  //    and they are still stored as numbers in Postgres. No harm done.

  return uid.getUniqueID().toString();
}
