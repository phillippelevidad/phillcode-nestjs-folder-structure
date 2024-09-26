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
    qb = this.addEagerRelations(qb);
    if (filter) qb = applyFilters(qb, this.target, 'entity', filter);
    return qb;
  }

  private addEagerRelations(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    const metadata = this.manager.connection.getMetadata(this.target);
    metadata.relations
      .filter((relation) => relation.isEager)
      .forEach((relation) => {
        qb.leftJoinAndSelect(
          `entity.${relation.propertyName}`,
          relation.propertyName,
        );
      });
    return qb;
  }
}
