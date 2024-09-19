import { Job } from 'bull';
import {
  BackgroundEventHandler,
  BackgroundEventsHandler,
} from 'src/application/background-event-handler';
import { CreateNotificationDto } from 'src/domain/notifications/dto/create-notification.dto';
import { NotificationsService } from 'src/domain/notifications/notifications.service';
import { EmployeeAddedEvent } from 'src/domain/users/events/employee-added.event';
import { UsersService } from 'src/domain/users/users.service';

@BackgroundEventsHandler(EmployeeAddedEvent, 'employee-added', 'notify-manager')
export class EmployeeAdded_NotifyManagerHandler extends BackgroundEventHandler<EmployeeAddedEvent> {
  constructor(
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async processJob(job: Job<EmployeeAddedEvent>): Promise<void> {
    const event = job.data;
    const employee = await this.users.findOne({ id: event.employeeId });

    const notification = new CreateNotificationDto(
      event.managerId,
      'New Employee Added',
      `A new employee, ${employee.firstName} ${employee.lastName}, has been added to your team. You can view their profile and assign them tasks in the app.`,
      `${employee.firstName} ${employee.lastName} has been added to your team.`,
    );

    await this.notifications.create(notification);
  }
}
