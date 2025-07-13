// index.ts - Main export file

import { Observable } from './observable';
import { createObservable, createObserver, isObservable, isObserver } from './utils';

// Re-export all types
export type {
    Brand,
    ObserverId,
    EventKey,
    SubjectId,
    Nominal,
    ObserverMetadata,
    EventPayload,
    ExtractEventType,
    EventMap,
    EventKeys,
    EventHandler,
    ConditionalEventHandler,
    EventHandlerMap,
    PartialEventHandlerMap,
    StrictEventMap,
    ValidatedEventMap,
    ObserverOptions,
    SubjectOptions,
    ObserverConstraint,
    SubjectConstraint,
    FilterEventMap,
    MapEventTypes,
    MergeEventMaps,
    EventMapFromTemplate,
    NestedEventMap,
    TypedEventMap
} from './types';

// Re-export interfaces
export type { IObservable, IObserver } from './interfaces';

// Re-export base class
export { BaseObservable } from './base';

// Re-export concrete implementations
export { Observable } from './observable';
export { Observer } from './observer';

// Re-export utilities
export {
    createObservable,
    createObserver,
    isObservable,
    isObserver,
    type EventKeyOf,
    type EventDataOf,
    type TypedObservable,
    type TypedObserver
} from './utils';

// Namespace export for convenience
export namespace ObserverPattern {
    export type EventMap = import('./types').EventMap;
    export type Observable<T extends EventMap = EventMap> =
        import('./observable').Observable<T>;
    export type Observer<T extends EventMap = EventMap> =
        import('./observer').Observer<T>;
    export type EventPayload<T = unknown> =
        import('./types').EventPayload<T>;
    export type ObserverId = import('./types').ObserverId;
    export type SubjectId = import('./types').SubjectId;

    export const create = {
        observable: createObservable,
        observer: createObserver,
    };

    export const guards = {
        isObservable,
        isObserver,
    };

    export const utils = {
        typed: Observable.typed,
    };
}

// Default export for convenience
export default ObserverPattern;