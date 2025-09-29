import type { DomainEvent } from './domain-event';
/**
 * Base interface for event handlers
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
    /**
     * Handle a domain event
     */
    handle(event: T): Promise<void>;
    /**
     * Get the event type this handler processes
     */
    getEventType(): string;
    /**
     * Check if this handler can process the event
     */
    canHandle(event: DomainEvent): boolean;
}
/**
 * Abstract base class for event handlers
 */
export declare abstract class BaseEventHandler<T extends DomainEvent = DomainEvent> implements EventHandler<T> {
    /**
     * Handle a domain event
     */
    abstract handle(event: T): Promise<void>;
    /**
     * Get the event type this handler processes
     */
    abstract getEventType(): string;
    /**
     * Check if this handler can process the event
     */
    canHandle(event: DomainEvent): boolean;
}
/**
 * Event handler registry for managing event handlers
 */
export declare class EventHandlerRegistry {
    private handlers;
    /**
     * Register an event handler
     */
    register(handler: EventHandler): void;
    /**
     * Get handlers for an event type
     */
    getHandlers(eventType: string): EventHandler[];
    /**
     * Get all registered event types
     */
    getEventTypes(): string[];
    /**
     * Clear all handlers
     */
    clear(): void;
    /**
     * Get handler count for an event type
     */
    getHandlerCount(eventType: string): number;
}
//# sourceMappingURL=event-handler.d.ts.map