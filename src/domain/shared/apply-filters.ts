import { isObject } from 'src/utils/is-object';
import { SelectQueryBuilder } from 'typeorm';

export type LogicalOperator = '$or' | '$and' | '$not';

export type Operator =
  | '$eq'
  | '$ne'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$in'
  | '$nin'
  | '$like'
  | '$ilike'
  | '$null'
  | '$between'
  | '$contains'
  | '$contained'
  | '$overlap'
  | '$startsWith'
  | '$endsWith';

type Primitive = string | number | boolean | null;

export type Condition = {
  [field: string]: { [key in Operator]?: Primitive | Primitive[] } | Primitive;
};

export interface LogicalFilter {
  $or?: Filter[];
  $and?: Filter[];
  $not?: Filter;
}

/**
 * The `filter` parameter can include logical operators (`$or`, `$and`, `$not`) as well as field-specific
 * comparison operators (e.g., `$eq`, `$ne`, `$in`, `$like`, etc.).
 *
 * ### Supported Logical Operators:
 * - `$or`: Combine multiple conditions where any one condition can be true.
 * - `$and`: Combine multiple conditions where all conditions must be true.
 * - `$not`: Negate a condition or group of conditions.
 *
 * ### Supported Field Comparison Operators:
 * - `$eq`: Equal to a value.
 * - `$ne`: Not equal to a value.
 * - `$gt`: Greater than a value.
 * - `$gte`: Greater than or equal to a value.
 * - `$lt`: Less than a value.
 * - `$lte`: Less than or equal to a value.
 * - `$in`: Value must be within an array of values.
 * - `$nin`: Value must not be within an array of values.
 * - `$like`: String matches a pattern (wildcard `%`).
 * - `$ilike`: Case-insensitive string matching (PostgreSQL).
 * - `$null`: Check if the value is NULL or NOT NULL.
 * - `$between`: Value must be between two values (inclusive).
 * - `$contains`: Array contains a specific value (PostgreSQL).
 * - `$contained`: Array is contained within another array (PostgreSQL).
 * - `$overlap`: Arrays overlap (share common elements).
 * - `$startsWith`: String starts with a given prefix.
 * - `$endsWith`: String ends with a given suffix.
 *
 * @example
 * // Basic Equality
 * const filter = { "name": { "$eq": "John" } };
 *
 * // Not equal to
 * const filter = { "age": { "$ne": 30 } };
 *
 * // Greater than
 * const filter = { "age": { "$gt": 25 } };
 *
 * // Less than or equal to
 * const filter = { "salary": { "$lte": 50000 } };
 *
 * // In an array
 * const filter = { "status": { "$in": ["active", "pending"] } };
 *
 * // Not in an array
 * const filter = { "role": { "$nin": ["admin", "moderator"] } };
 *
 * // LIKE pattern matching
 * const filter = { "name": { "$like": "%Smith%" } };
 *
 * // Case-insensitive ILIKE matching (PostgreSQL)
 * const filter = { "email": { "$ilike": "%@gmail.com" } };
 *
 * // NULL check
 * const filter = { "deletedAt": { "$null": true } };  // checks if `deletedAt` IS NULL
 * const filter = { "deletedAt": { "$null": false } }; // checks if `deletedAt` IS NOT NULL
 *
 * // Between two values (e.g., range filtering)
 * const filter = { "createdAt": { "$between": ["2023-01-01", "2023-12-31"] } };
 *
 * // Array contains a value (PostgreSQL specific)
 * const filter = { "tags": { "$contains": "featured" } };
 *
 * // Array is contained within another array (PostgreSQL specific)
 * const filter = { "tags": { "$contained": ["featured", "popular"] } };
 *
 * // Arrays overlap (share any common elements, PostgreSQL specific)
 * const filter = { "tags": { "$overlap": ["new", "featured"] } };
 *
 * // String starts with
 * const filter = { "username": { "$startsWith": "admin" } };
 *
 * // String ends with
 * const filter = { "filename": { "$endsWith": ".jpg" } };
 *
 * // Logical Operators
 * const filter = {
 *   "$or": [
 *     { "age": { "$lt": 18 } },
 *     { "age": { "$gt": 60 } }
 *   ]
 * };
 *
 * const filter = {
 *   "$and": [
 *     { "status": { "$eq": "active" } },
 *     { "age": { "$gte": 18 } }
 *   ]
 * };
 *
 * const filter = {
 *   "$not": { "status": { "$eq": "inactive" } }
 * };
 */
export type Filter = string | Condition | LogicalFilter;

export interface Item {
  [key: string]: any;
}

/**
 * Applies filtering conditions to a TypeORM query builder based on a provided filter object.
 *
 * @param qb - TypeORM SelectQueryBuilder to apply the filters to.
 * @param filter - The filter object containing conditions and logical operators.
 * @param alias - The alias for the main entity being queried (default: "entity").
 *
 * @returns The modified SelectQueryBuilder with applied conditions.
 */
export function applyFilters<T>(
  qb: SelectQueryBuilder<T>,
  filter: Filter,
  alias: string = 'entity',
): SelectQueryBuilder<T> {
  filter = parseFilter(filter);
  if (!isObject(filter)) return qb;

  Object.keys(filter).forEach((key) => {
    const value = filter[key as keyof Filter];

    switch (key) {
      case '$or':
        const orConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, subFilter, alias).getQuery(),
        );
        qb.andWhere(`(${orConditions.join(' OR ')})`);
        break;

      case '$and':
        const andConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, subFilter, alias).getQuery(),
        );
        qb.andWhere(`(${andConditions.join(' AND ')})`);
        break;

      case '$not':
        const notCondition = applyFilters(
          qb,
          value as Filter,
          alias,
        ).getQuery();
        qb.andWhere(`NOT (${notCondition})`);
        break;

      default:
        applyCondition(qb, key, value, alias);
    }
  });

  return qb;
}

function parseFilter(filter: Filter): Filter | null {
  if (!filter) return null;
  if (typeof filter === 'string') {
    try {
      return JSON.parse(filter);
    } catch {
      return null;
    }
  }
  return filter;
}

function applyCondition<T>(
  qb: SelectQueryBuilder<T>,
  key: string,
  value: any,
  alias: string,
): void {
  if (value === null) {
    qb.andWhere(`${alias}.${key} IS NULL`);
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    Object.keys(value).forEach((operator: string) => {
      evaluateOperator(qb, key, operator as Operator, value[operator], alias);
    });
  } else {
    const [relation, field] = key.split('.');
    if (field) {
      const relationAlias = `${alias}_${relation}`;
      qb.leftJoinAndSelect(`${alias}.${relation}`, relationAlias);
      qb.andWhere(`${relationAlias}.${field} = :${relationAlias}_${field}`, {
        [`${relationAlias}_${field}`]: value,
      });
    } else {
      qb.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
    }
  }
}

function evaluateOperator<T>(
  qb: SelectQueryBuilder<T>,
  key: string,
  operator: Operator,
  expectedValue: any,
  alias: string,
): void {
  const field = `${alias}.${key}`;

  switch (operator) {
    case '$eq':
      qb.andWhere(`${field} = :${key}`, { [key]: expectedValue });
      break;
    case '$ne':
      qb.andWhere(`${field} != :${key}`, { [key]: expectedValue });
      break;
    case '$gt':
      qb.andWhere(`${field} > :${key}`, { [key]: expectedValue });
      break;
    case '$gte':
      qb.andWhere(`${field} >= :${key}`, { [key]: expectedValue });
      break;
    case '$lt':
      qb.andWhere(`${field} < :${key}`, { [key]: expectedValue });
      break;
    case '$lte':
      qb.andWhere(`${field} <= :${key}`, { [key]: expectedValue });
      break;
    case '$in':
      qb.andWhere(`${field} IN (:...${key})`, { [key]: expectedValue });
      break;
    case '$nin':
      qb.andWhere(`${field} NOT IN (:...${key})`, { [key]: expectedValue });
      break;
    case '$like':
      qb.andWhere(`${field} LIKE :${key}`, { [key]: expectedValue });
      break;
    case '$ilike':
      qb.andWhere(`${field} ILIKE :${key}`, { [key]: expectedValue });
      break;
    case '$null':
      if (expectedValue === true) {
        qb.andWhere(`${field} IS NULL`);
      } else {
        qb.andWhere(`${field} IS NOT NULL`);
      }
      break;
    case '$between':
      qb.andWhere(`${field} BETWEEN :start AND :end`, {
        start: expectedValue[0],
        end: expectedValue[1],
      });
      break;
    case '$contains':
      qb.andWhere(`${field} @> :${key}`, { [key]: expectedValue });
      break;
    case '$contained':
      qb.andWhere(`${field} <@ :${key}`, { [key]: expectedValue });
      break;
    case '$overlap':
      qb.andWhere(`${field} && :${key}`, { [key]: expectedValue });
      break;
    case '$startsWith':
      qb.andWhere(`${field} LIKE :${key}`, { [key]: `${expectedValue}%` });
      break;
    case '$endsWith':
      qb.andWhere(`${field} LIKE :${key}`, { [key]: `%${expectedValue}` });
      break;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}
