import { Job, Queue } from 'bull';
import { getQueueToken, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, SetMetadata, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

export const QUEUE_NAME_METADATA = 'QUEUE_NAME_METADATA';
export const JOB_NAME_METADATA = 'JOB_NAME_METADATA';

export function BackgroundEventsHandler(
  eventClass: Type<any>,
  queueName: string,
  jobName: string,
) {
  return function (target: Type<any>) {
    // Apply the @Processor decorator to the class
    Processor(queueName)(target);

    // Apply the @EventsHandler decorator to the class for the specified event
    EventsHandler(eventClass)(target);

    // Store metadata for queue and job names
    SetMetadata(QUEUE_NAME_METADATA, queueName)(target);
    SetMetadata(JOB_NAME_METADATA, jobName)(target);

    // Apply the @Process decorator to the processJob method
    const processJobMethod = target.prototype.processJob;
    if (processJobMethod) {
      Process(jobName)(
        target.prototype,
        'processJob',
        Object.getOwnPropertyDescriptor(target.prototype, 'processJob'),
      );
    }
  };
}

@Injectable()
export abstract class BackgroundEventHandler<TEvent>
  implements IEventHandler<TEvent>
{
  @Inject()
  private readonly moduleRef: ModuleRef;

  protected queue: Queue;

  async handle(event: TEvent): Promise<void> {
    const jobName = Reflect.getMetadata(JOB_NAME_METADATA, this.constructor);
    if (!jobName) {
      throw new Error(
        `Job name not found in metadata for ${this.constructor.name}`,
      );
    }

    if (!this.queue) {
      const queueName = Reflect.getMetadata(
        QUEUE_NAME_METADATA,
        this.constructor,
      );
      if (!queueName) {
        throw new Error(
          `Queue name not found in metadata for ${this.constructor.name}`,
        );
      }

      // Retrieve the queue instance using ModuleRef
      const queueToken = getQueueToken(queueName);
      this.queue = this.moduleRef.get<Queue>(queueToken, {
        strict: false,
      });
      if (!this.queue) {
        throw new Error(`Queue '${queueName}' not found in the module context`);
      }
    }

    await this.queue.add(jobName, event);
  }

  abstract processJob(job: Job<TEvent>): Promise<void>;
}
