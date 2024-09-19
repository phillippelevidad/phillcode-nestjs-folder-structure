import { DomainEvent } from 'src/domain/shared/domain-events/domain-event';

export class EmployeeAddedEvent implements DomainEvent {
  public occurredOn: Date;

  constructor(
    public readonly managerId: string,
    public readonly employeeId: string,
  ) {
    this.occurredOn = new Date();
  }
}
