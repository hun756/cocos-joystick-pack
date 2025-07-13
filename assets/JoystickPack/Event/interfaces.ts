import {
    EventMap,
    EventKeys,
    SubjectId,
    ObserverId,
    ObserverMetadata,
    ObserverOptions,
    ConditionalEventHandler,
    PartialEventHandlerMap,
    ExtractEventType
} from './types';

export interface IObservable<TEventMap extends EventMap = EventMap> {
    readonly id: SubjectId;

    subscribe<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        handler: ConditionalEventHandler<TEventMap, TKey>,
        options?: ObserverOptions
    ): ObserverId;

    subscribe<TKey extends EventKeys<TEventMap>>(
        handlers: Pick<PartialEventHandlerMap<TEventMap>, TKey>,
        options?: ObserverOptions
    ): ObserverId;

    unsubscribe(observerId: ObserverId): boolean;
    unsubscribe<TKey extends EventKeys<TEventMap>>(eventKey: TKey): number;
    unsubscribe(): void;

    emit<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        data: ExtractEventType<TEventMap[TKey]>,
        metadata?: Record<string, unknown>
    ): Promise<void>;

    hasObservers<TKey extends EventKeys<TEventMap>>(eventKey: TKey): boolean;
    getObserverCount<TKey extends EventKeys<TEventMap>>(eventKey: TKey): number;

    pipe<TTargetEventMap extends EventMap>(
        target: IObservable<TTargetEventMap>,
        eventMapping?: Partial<
            Record<EventKeys<TEventMap>, EventKeys<TTargetEventMap>>
        >
    ): () => void;
}

export interface IObserver<TEventMap extends EventMap = EventMap> {
    readonly id: ObserverId;
    readonly metadata: ObserverMetadata;

    observe<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        eventKey: TKey,
        handler: ConditionalEventHandler<TEventMap, TKey>
    ): void;

    observe<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        handlers: Pick<PartialEventHandlerMap<TEventMap>, TKey>
    ): void;

    unobserve(subject: IObservable<TEventMap>): void;
    unobserve<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        eventKey: TKey
    ): void;

    isObserving(subject: IObservable<TEventMap>): boolean;
    getObservedSubjects(): readonly IObservable<TEventMap>[];
}