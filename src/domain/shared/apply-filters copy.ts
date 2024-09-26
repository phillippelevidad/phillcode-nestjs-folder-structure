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
        // input: { "$or": [ { "age": { "$lt": 18 } }, { "age": { "$gt": 60 } } ] }
        // result: (age < 18 OR age > 60)
        const orConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, subFilter, alias).getQuery(),
        );
        qb.andWhere(`(${orConditions.join(' OR ')})`);
        break;

      case '$and':
        // input: { "$and": [ { "age": { "$gte": 18 } }, { "age": { "$lte": 60 } } ] }
        // result: (age >= 18 AND age <= 60)
        const andConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, subFilter, alias).getQuery(),
        );
        qb.andWhere(`(${andConditions.join(' AND ')})`);
        break;

      case '$not':
        // input: { "$not": { "age": { "$eq": 30 } } }
        // result: NOT (age = 30)
        const notCondition = applyFilters(
          qb,
          value as Filter,
          alias,
        ).getQuery();
        qb.andWhere(`NOT (${notCondition})`);
        break;

      default:
        // input: { "age": { "$eq": 25 } }
        // result: age = 25
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
    // input: { "age": null }
    // result: age IS NULL
    qb.andWhere(`${alias}.${key} IS NULL`);
    return;
  }

  const [relation, field] = key.split('.');

  if (field) {
    // Handle nested properties
    const relationAlias = `${alias}_${relation}`;
    qb.leftJoinAndSelect(`${alias}.${relation}`, relationAlias);

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Process operators for the related field
      // input: { "age": { "$gt": 18 } }
      // result: age > 18
      Object.keys(value).forEach((operator: string) => {
        evaluateOperatorForNestedRelation(
          qb,
          field,
          operator as Operator,
          value[operator],
          relationAlias,
          alias,
        );
      });
    } else {
      qb.andWhere(`${relationAlias}.${field} = :${relationAlias}_${field}`, {
        [`${relationAlias}_${field}`]: value,
      });
    }
  } else {
    // Handle non-nested conditions
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach((operator: string) => {
        evaluateOperator(qb, key, operator as Operator, value[operator], alias);
      });
    } else {
      qb.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
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
    const { condition, params } = generateSqlForOperator(
      field,
      key,
      operator,
      expectedValue,
    );
    qb.andWhere(condition, params);
  }

  function evaluateOperatorForNestedRelation<T>(
    qb: SelectQueryBuilder<T>,
    key: string,
    operator: Operator,
    expectedValue: any,
    relationAlias: string,
    rootAlias: string,
  ): void {
    const field = `${relationAlias}.${key}`;
    const { condition, params } = generateSqlForOperator(
      field,
      key,
      operator,
      expectedValue,
    );
    qb.andWhere(
      `${rootAlias}.id IN (SELECT ${rootAlias}_sub.id FROM ${rootAlias} ${rootAlias}_sub LEFT JOIN ${rootAlias}_sub.${key.split('.')[0]} ${relationAlias}_sub WHERE ${condition})`,
      params,
    );
  }

  function generateSqlForOperator(
    field: string,
    key: string,
    operator: Operator,
    expectedValue: any,
  ): { condition: string; params: Record<string, any> } {
    let condition: string;
    let params: Record<string, any> = { [key]: expectedValue };

    switch (operator) {
      case '$eq':
        condition = `${field} = :${key}`;
        break;

      case '$ne':
        condition = `${field} != :${key}`;
        break;

      case '$gt':
        condition = `${field} > :${key}`;
        break;

      case '$gte':
        condition = `${field} >= :${key}`;
        break;

      case '$lt':
        condition = `${field} < :${key}`;
        break;

      case '$lte':
        condition = `${field} <= :${key}`;
        break;

      case '$in':
        condition = `${field} IN (:...${key})`;
        break;

      case '$nin':
        condition = `${field} NOT IN (:...${key})`;
        break;

      case '$like':
        condition = `${field} LIKE :${key}`;
        break;

      case '$ilike':
        condition = `${field} ILIKE :${key}`;
        break;

      case '$null':
        if (expectedValue === true) {
          condition = `${field} IS NULL`;
          params = {}; // No parameters needed for NULL checks
        } else {
          condition = `${field} IS NOT NULL`;
          params = {}; // No parameters needed for NOT NULL checks
        }
        break;

      case '$between':
        condition = `${field} BETWEEN :start AND :end`;
        params = { start: expectedValue[0], end: expectedValue[1] };
        break;

      case '$contains':
        condition = `${field} @> :${key}`;
        break;

      case '$contained':
        condition = `${field} <@ :${key}`;
        break;

      case '$overlap':
        condition = `${field} && :${key}`;
        break;

      case '$startsWith':
        condition = `${field} LIKE :${key}`;
        params = { [key]: `${expectedValue}%` };
        break;

      case '$endsWith':
        condition = `${field} LIKE :${key}`;
        params = { [key]: `%${expectedValue}` };
        break;

      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }

    return { condition, params };
  }
}
