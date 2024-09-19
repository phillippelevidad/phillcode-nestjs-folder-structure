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
    let qb = this.manager.createQueryBuilder(this.target, 'entity');
    if (filter) qb = applyFilters(qb, filter, 'entity');
    return qb;
  }
}
