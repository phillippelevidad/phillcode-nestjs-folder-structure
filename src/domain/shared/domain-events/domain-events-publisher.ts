import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DomainEvent } from './domain-event';

@Injectable()
export class DomainEventsPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publishEvents(events: DomainEvent[]) {
    events.forEach((event) => {
      this.eventBus.publish(event);
    });
  }
}
