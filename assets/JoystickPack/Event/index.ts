import { Observable } from './observable';
import {
    createObservable,
    createObserver,
    isObservable,
    isObserver,
} from './utils';

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
    TypedEventMap,
} from './types';

export type { IObservable, IObserver } from './interfaces';

export { BaseObservable } from './base';

export { Observable } from './observable';
export { Observer } from './observer';

export {
    createObservable,
    createObserver,
    isObservable,
    isObserver,
    type EventKeyOf,
    type EventDataOf,
    type TypedObservable,
    type TypedObserver,
} from './utils';

export namespace ObserverPattern {
    export type EventMap = import('./types').EventMap;
    export type Observable<T extends EventMap = EventMap> =
        import('./observable').Observable<T>;
    export type Observer<T extends EventMap = EventMap> =
        import('./observer').Observer<T>;
    export type EventPayload<T = unknown> = import('./types').EventPayload<T>;
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

export default ObserverPattern;
