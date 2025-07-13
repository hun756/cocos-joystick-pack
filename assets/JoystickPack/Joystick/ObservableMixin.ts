import {
    IObservable,
    ObserverId,
    ConditionalEventHandler,
    PartialEventHandlerMap,
    ObserverOptions,
    ExtractEventType,
    EventMap,
    EventKeys,
    SubjectId,
} from '../Event';

export abstract class ObservableMixin<TEventMap extends EventMap>
    implements IObservable<TEventMap>
{
    protected abstract getObservable(): IObservable<TEventMap>;

    public abstract get id(): SubjectId;

    public subscribe<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        handler: ConditionalEventHandler<TEventMap, TKey>,
        options?: ObserverOptions
    ): ObserverId;
    public subscribe<TKey extends EventKeys<TEventMap>>(
        handlers: Pick<PartialEventHandlerMap<TEventMap>, TKey>,
        options?: ObserverOptions
    ): ObserverId;
    public subscribe<TKey extends EventKeys<TEventMap>>(
        eventKeyOrHandlers:
            | TKey
            | Pick<PartialEventHandlerMap<TEventMap>, TKey>,
        handlerOrOptions?:
            | ConditionalEventHandler<TEventMap, TKey>
            | ObserverOptions,
        options?: ObserverOptions
    ): ObserverId {
        return this.getObservable().subscribe(
            eventKeyOrHandlers as any,
            handlerOrOptions as any,
            options
        );
    }

    public unsubscribe(observerId: ObserverId): boolean;
    public unsubscribe<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey
    ): number;
    public unsubscribe(): void;
    public unsubscribe(
        observerIdOrEventKey?: ObserverId | EventKeys<TEventMap>
    ): boolean | number | void {
        return this.getObservable().unsubscribe(observerIdOrEventKey as any);
    }

    public async emit<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        data: ExtractEventType<TEventMap[TKey]>,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        return this.getObservable().emit(eventKey, data, metadata);
    }

    public hasObservers<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey
    ): boolean {
        return this.getObservable().hasObservers(eventKey);
    }

    public getObserverCount<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey
    ): number {
        return this.getObservable().getObserverCount(eventKey);
    }

    public pipe<TTargetEventMap extends EventMap>(
        target: IObservable<TTargetEventMap>,
        eventMapping?: Partial<
            Record<EventKeys<TEventMap>, EventKeys<TTargetEventMap>>
        >
    ): () => void {
        return this.getObservable().pipe(target, eventMapping);
    }
}
