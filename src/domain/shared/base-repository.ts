import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { applyFilters, Filter } from './apply-filters';

export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {
  constructor(
    readonly target: EntityTarget<T>,
    dataSource: DataSource,
  ) {
    super(target, dataSource.manager);
  }

  async filterExists(filter: Filter): Promise<boolean> {
    return this.getFilteredQueryBuilder(filter).getExists();
  }

  async filterOne(filter: Filter): Promise<T | null> {
    return (await this.getFilteredQueryBuilder(filter).getOne()) ?? null;
  }

  async filterAll(filter?: Filter): Promise<T[]> {
    return this.getFilteredQueryBuilder(filter).getMany();
  }

  private getFilteredQueryBuilder(filter?: Filter): SelectQueryBuilder<T> {
    const parsedFilter = this.parseFilter(filter);
    let qb = this.manager.createQueryBuilder(this.target, 'entity');
    if (parsedFilter) qb = applyFilters(qb, parsedFilter, 'entity');
    return qb;
  }

  private parseFilter(filter: Filter): Filter | null {
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
}
