import type { DomainEvent } from '../core/domain-event';
/**
 * Event serialization interface
 */
export interface EventSerializer {
    serialize(event: DomainEvent): string;
    deserialize<T extends DomainEvent>(eventType: string, data: string): T;
}
/**
 * JSON-based event serializer
 */
export declare class JsonEventSerializer implements EventSerializer {
    private eventTypes;
    /**
     * Register an event type for deserialization
     */
    registerEventType(eventType: string, eventClass: new (...args: unknown[]) => DomainEvent): void;
    /**
     * Serialize an event to JSON
     */
    serialize(event: DomainEvent): string;
    /**
     * Deserialize an event from JSON
     */
    deserialize<T extends DomainEvent>(eventType: string, data: string): T;
    /**
     * Get registered event types
     */
    getRegisteredEventTypes(): string[];
    /**
     * Check if an event type is registered
     */
    isEventTypeRegistered(eventType: string): boolean;
}
/**
 * Default event serializer instance
 */
export declare const defaultEventSerializer: JsonEventSerializer;
//# sourceMappingURL=event-serializer.d.ts.map