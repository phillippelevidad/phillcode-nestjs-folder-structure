import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '../aggregate-root';

@Injectable()
export class DomainEventsStore {
  private entitiesWithEvents: AggregateRoot[] = [];

  collect(entity: AggregateRoot) {
    if (!(entity instanceof AggregateRoot)) {
      return;
    }
    this.entitiesWithEvents.push(entity);
  }

  get() {
    return this.entitiesWithEvents.flatMap((entity) => entity.domainEvents);
  }

  clear() {
    for (const entity of this.entitiesWithEvents) {
      entity.domainEvents = [];
    }
    this.entitiesWithEvents = [];
  }
}
