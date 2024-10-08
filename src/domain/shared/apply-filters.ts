import { isObject } from 'src/utils/is-object';
import { EntityTarget, SelectQueryBuilder } from 'typeorm';

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
 * @param target - The target entity class or table name being queried.
 * @param alias - The alias for the main entity being queried (default: "entity").
 * @param filter - The filter object containing conditions and logical operators.
 *
 * @returns The modified SelectQueryBuilder with applied conditions.
 */
export function applyFilters<T>(
  qb: SelectQueryBuilder<T>,
  target: EntityTarget<T>,
  alias: string,
  filter: Filter,
): SelectQueryBuilder<T> {
  filter = parseFilter(filter);
  if (!isObject(filter)) return qb;

  Object.keys(filter).forEach((key) => {
    const value = filter[key as keyof Filter];

    switch (key) {
      case '$or':
        const orConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, target, alias, subFilter).getQuery(),
        );
        qb.andWhere(`(${orConditions.join(' OR ')})`);
        break;

      case '$and':
        const andConditions = (value as Filter[]).map((subFilter) =>
          applyFilters(qb, target, alias, subFilter).getQuery(),
        );
        qb.andWhere(`(${andConditions.join(' AND ')})`);
        break;

      case '$not':
        const notCondition = applyFilters(
          qb,
          target,
          alias,
          value as Filter,
        ).getQuery();
        qb.andWhere(`NOT (${notCondition})`);
        break;

      default:
        applyCondition(qb, target, alias, key, value);
    }
  });

  return qb;
}

function parseFilter(filter: Filter): Filter | null {
  if (!filter) return null;
  if (typeof filter === 'string') {
    try {
      filter = JSON.parse(filter);
    } catch {
      return null;
    }
  }
  return filter;
}

function applyCondition<T>(
  qb: SelectQueryBuilder<T>,
  target: EntityTarget<T>,
  alias: string,
  path: string,
  value: any,
): void {
  value = transformValue(value);
  if (path.includes('.')) {
    applyRelationCondition(qb, target, alias, path, value);
  } else {
    applySimpleCondition(qb, alias, path, value);
  }
}

function applyRelationCondition<T>(
  qb: SelectQueryBuilder<T>,
  target: EntityTarget<T>,
  alias: string,
  path: string,
  value: any,
): void {
  const metadata = qb.connection.getMetadata(target);
  const [relation, field] = path.split('.');

  // Check if relation exists in the metadata
  if (metadata.findRelationWithPropertyPath(relation)) {
    const relationAlias = `${alias}_${relation}`;
    Object.keys(value).forEach((operator: string) => {
      evaluateOperatorForNestedRelation(
        qb,
        target,
        alias,
        relation,
        relationAlias,
        field,
        operator as Operator,
        value[operator],
      );
    });
  }
}

function applySimpleCondition<T>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  path: string,
  value: any,
): void {
  Object.keys(value).forEach((operator: string) => {
    evaluateOperator(qb, path, operator as Operator, value[operator], alias);
  });
}

function transformValue(value: any): any {
  if (value === null) {
    return { $null: true };
  }
  if (!(typeof value === 'object' && !Array.isArray(value))) {
    return { $eq: value };
  }
  return value;
}

function evaluateOperator<T>(
  qb: SelectQueryBuilder<T>,
  field: string,
  operator: Operator,
  expectedValue: any,
  alias: string,
): void {
  const path = `${alias}.${field}`;
  const { condition, params } = generateSqlForOperator(
    field,
    path,
    operator,
    expectedValue,
  );
  qb.andWhere(condition, params);
}

function evaluateOperatorForNestedRelation<T>(
  qb: SelectQueryBuilder<T>,
  target: EntityTarget<T>,
  targetAlias: string,
  relation: string,
  relationAlias: string,
  field: string,
  operator: Operator,
  expectedValue: any,
): void {
  const path = `"${relationAlias}_sub"."${field}"`;
  const { condition, params } = generateSqlForOperator(
    field,
    path,
    operator,
    expectedValue,
  );

  const targetMetadata = qb.connection.getMetadata(target);
  const relationMetadata =
    targetMetadata.findRelationWithPropertyPath(relation);
  const joinColumn = `${relationMetadata.inverseSidePropertyPath}Id`;

  qb.andWhere(
    `"${targetAlias}"."id" IN (
      SELECT "${targetAlias}_sub"."id"
      FROM "${targetMetadata.givenTableName}" "${targetAlias}_sub"
      JOIN "${relationMetadata.inverseEntityMetadata.tableName}" "${relationAlias}_sub"
      ON "${relationAlias}_sub"."${joinColumn}" = "${targetAlias}_sub"."id"
      WHERE ${condition}
    )`,
    params,
  );
}

function generateSqlForOperator(
  field: string,
  path: string,
  operator: Operator,
  expectedValue: any,
): { condition: string; params: Record<string, any> } {
  let condition: string;
  let params: Record<string, any> = { [field]: expectedValue };

  switch (operator) {
    case '$eq':
      condition = `${path} = :${field}`;
      break;

    case '$ne':
      condition = `${path} != :${field}`;
      break;

    case '$gt':
      condition = `${path} > :${field}`;
      break;

    case '$gte':
      condition = `${path} >= :${field}`;
      break;

    case '$lt':
      condition = `${path} < :${field}`;
      break;

    case '$lte':
      condition = `${path} <= :${field}`;
      break;

    case '$in':
      if (!Array.isArray(expectedValue)) {
        throw new Error(
          `Operator $in expects an array but received: ${typeof expectedValue}`,
        );
      }
      condition = `${path} IN (:...${field})`;
      break;

    case '$nin':
      if (!Array.isArray(expectedValue)) {
        throw new Error(
          `Operator $nin expects an array but received: ${typeof expectedValue}`,
        );
      }
      condition = `${path} NOT IN (:...${field})`;
      break;

    case '$like':
      condition = `${path} LIKE :${field}`;
      break;

    case '$ilike':
      condition = `${path} ILIKE :${field}`;
      break;

    case '$null':
      if (expectedValue === true) {
        condition = `${path} IS NULL`;
        params = {};
      } else {
        condition = `${path} IS NOT NULL`;
        params = {};
      }
      break;

    case '$between':
      if (!Array.isArray(expectedValue) || expectedValue.length !== 2) {
        throw new Error(
          `Operator $between expects an array of two elements but received: ${typeof expectedValue}`,
        );
      }
      condition = `${path} BETWEEN :start AND :end`;
      params = { start: expectedValue[0], end: expectedValue[1] };
      break;

    case '$contains':
      condition = `${path} @> :${field}`;
      break;

    case '$contained':
      condition = `${path} <@ :${field}`;
      break;

    case '$overlap':
      condition = `${path} && :${field}`;
      break;

    case '$startsWith':
      condition = `${path} LIKE :${field}`;
      params = { [field]: `${expectedValue}%` };
      break;

    case '$endsWith':
      condition = `${path} LIKE :${field}`;
      params = { [field]: `%${expectedValue}` };
      break;

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }

  return { condition, params };
}
