import type { DomainEvent } from './domain-event';
/**
 * Base class for aggregate roots in the Event Sourcing system
 */
export declare abstract class AggregateRoot {
    private uncommittedEvents;
    private version;
    protected id: string;
    constructor(id: string, version?: number);
    /**
     * Get the aggregate ID
     */
    getId(): string;
    /**
     * Get the current version
     */
    getVersion(): number;
    /**
     * Get uncommitted events
     */
    getUncommittedEvents(): DomainEvent[];
    /**
     * Mark events as committed
     */
    markEventsAsCommitted(): void;
    /**
     * Add a new domain event
     */
    protected addEvent(event: DomainEvent): void;
    /**
     * Apply an event to the aggregate state
     * Must be implemented by subclasses
     */
    protected abstract apply(event: DomainEvent): void;
    /**
     * Load aggregate from events
     */
    static fromEvents<T extends AggregateRoot>(this: new (id: string, version: number) => T, id: string, events: DomainEvent[]): T;
    /**
     * Check if aggregate has uncommitted events
     */
    hasUncommittedEvents(): boolean;
    /**
     * Get the number of uncommitted events
     */
    getUncommittedEventCount(): number;
}
//# sourceMappingURL=aggregate-root.d.ts.map