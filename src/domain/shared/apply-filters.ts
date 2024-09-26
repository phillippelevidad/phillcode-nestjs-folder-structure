import { isObject } from 'src/utils/is-object';
import { EntityTarget, QueryBuilder, SelectQueryBuilder } from 'typeorm';

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

export type Filter = string | Condition | LogicalFilter;

export interface Item {
  [key: string]: any;
}

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
      return JSON.parse(filter);
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
  const metadata = qb.connection.getMetadata(target);

  // If it's a relation (e.g., "skills.score")
  if (path.includes('.')) {
    const [relation, field] = path.split('.');

    // Use metadata to dynamically detect relations and join conditions
    if (metadata.findRelationWithPropertyPath(relation)) {
      const relationAlias = `${alias}_${relation}`;

      if (typeof value === 'object' && !Array.isArray(value)) {
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
      } else {
        qb.leftJoinAndSelect(`${alias}.${relation}`, relationAlias);
        qb.andWhere(`${relationAlias}.${field} = :${relationAlias}_${field}`, {
          [`${relationAlias}_${field}`]: value,
        });
      }
    }
  } else {
    // If it's a simple condition (e.g., "age" or "name")
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach((operator: string) => {
        evaluateOperator(
          qb,
          path,
          operator as Operator,
          value[operator],
          alias,
        );
      });
    } else {
      qb.andWhere(`${alias}.${path} = :${path}`, { [path]: value });
    }
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

    // Get metadata for the target entity
    const targetMetadata = qb.connection.getMetadata(target);

    // Find the relation metadata for the given relation name
    const relationMetadata =
      targetMetadata.findRelationWithPropertyPath(relation);

    // Get the join column(s) for the relation
    const joinColumn = `${relationMetadata.inverseSidePropertyPath}Id`;

    // Apply the condition using a subquery with the correct dynamic join
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
        condition = `${path} IN (:...${field})`;
        break;

      case '$nin':
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
}

export function getTableName<T>(
  qb: QueryBuilder<T>,
  target: EntityTarget<T>,
): string {
  return qb.connection.getMetadata(target).tableName;
}
