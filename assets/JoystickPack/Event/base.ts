import {
    EventMap,
    EventKeys,
    EventHandler,
    EventPayload,
    SubjectId,
    ObserverId,
    ObserverMetadata,
    ObserverOptions,
    SubjectOptions,
    ConditionalEventHandler,
    PartialEventHandlerMap,
    ExtractEventType
} from './types';
import { IObservable } from './interfaces';

export abstract class BaseObservable<TEventMap extends EventMap>
    implements IObservable<TEventMap>
{
    readonly id: SubjectId;

    protected readonly observers = new Map<
        EventKeys<TEventMap>,
        Map<
            ObserverId,
            {
                handler: EventHandler;
                metadata: ObserverMetadata;
                signal?: AbortSignal;
            }
        >
    >();

    protected readonly options: Required<SubjectOptions>;

    constructor(id: string, options: SubjectOptions = {}) {
        this.id = id as SubjectId;
        this.options = {
            maxObservers: options.maxObservers ?? Infinity,
            enableMetrics: options.enableMetrics ?? false,
            batchUpdates: options.batchUpdates ?? false,
            errorStrategy: options.errorStrategy ?? 'throw',
        };
    }

    subscribe<TKey extends EventKeys<TEventMap>>(
        eventKeyOrHandlers:
            | TKey
            | Pick<PartialEventHandlerMap<TEventMap>, TKey>,
        handlerOrOptions?:
            | ConditionalEventHandler<TEventMap, TKey>
            | ObserverOptions,
        options?: ObserverOptions
    ): ObserverId {
        if (typeof eventKeyOrHandlers === 'string') {
            const eventKey = eventKeyOrHandlers;
            const handler = handlerOrOptions as ConditionalEventHandler<
                TEventMap,
                TKey
            >;
            return this.addObserver(eventKey, handler, options ?? {});
        } else {
            const handlers = eventKeyOrHandlers;
            const opts = handlerOrOptions as ObserverOptions | undefined;
            const observerId = this.generateObserverId();

            for (const eventKey in handlers) {
                const handler = handlers[eventKey];
                if (handler) {
                    this.addObserver(eventKey as TKey, handler, {
                        ...opts,
                        observerId,
                    });
                }
            }

            return observerId;
        }
    }

    unsubscribe(observerId: ObserverId): boolean;
    unsubscribe<TKey extends EventKeys<TEventMap>>(eventKey: TKey): number;
    unsubscribe(): void;
    unsubscribe(
        observerIdOrEventKey?: ObserverId | EventKeys<TEventMap>
    ): boolean | number | void {
        if (!observerIdOrEventKey) {
            this.observers.clear();
            return;
        }

        if (this.isObserverId(observerIdOrEventKey)) {
            return this.removeObserverById(observerIdOrEventKey);
        } else {
            return this.removeObserversByEventKey(
                observerIdOrEventKey as EventKeys<TEventMap>
            );
        }
    }

    async emit<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        data: ExtractEventType<TEventMap[TKey]>,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const event: EventPayload = {
            type: eventKey,
            timestamp: Date.now(),
            data,
            metadata,
        };

        const eventObservers = this.observers.get(eventKey);
        if (!eventObservers?.size) return;

        const sortedObservers = Array.from(eventObservers.entries()).sort(
            ([, a], [, b]) => b.metadata.priority - a.metadata.priority
        );

        const promises: Promise<void>[] = [];
        const toRemove: ObserverId[] = [];

        for (const [
            observerId,
            { handler, metadata, signal },
        ] of sortedObservers) {
            if (signal?.aborted) {
                toRemove.push(observerId);
                continue;
            }

            try {
                const result = handler(event as any);
                if (result instanceof Promise) {
                    promises.push(result);
                }

                if (metadata.once) {
                    toRemove.push(observerId);
                }
            } catch (error) {
                this.handleError(error, eventKey, observerId);
            }
        }

        toRemove.forEach((id) => this.removeObserverById(id));

        if (promises.length > 0) {
            await Promise.all(promises.map((p) => p.catch(() => {})));
        }
    }

    hasObservers<TKey extends EventKeys<TEventMap>>(eventKey: TKey): boolean {
        return (this.observers.get(eventKey)?.size ?? 0) > 0;
    }

    getObserverCount<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey
    ): number {
        return this.observers.get(eventKey)?.size ?? 0;
    }

    pipe<TTargetEventMap extends EventMap>(
        target: IObservable<TTargetEventMap>,
        eventMapping?: Partial<
            Record<EventKeys<TEventMap>, EventKeys<TTargetEventMap>>
        >
    ): () => void {
        const subscriptions: ObserverId[] = [];

        for (const [sourceEvent] of this.observers) {
            const targetEvent =
                eventMapping?.[sourceEvent] ?? (sourceEvent as any);

            const observerId = this.subscribe(sourceEvent, (async (event) => {
                await target.emit(
                    targetEvent,
                    event.data as any,
                    event.metadata
                );
            }) as ConditionalEventHandler<TEventMap, typeof sourceEvent>);

            subscriptions.push(observerId);
        }

        return () => {
            subscriptions.forEach((id) => this.unsubscribe(id));
        };
    }

    protected addObserver<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey,
        handler: ConditionalEventHandler<TEventMap, TKey>,
        options: ObserverOptions & { observerId?: ObserverId }
    ): ObserverId {
        if (!this.observers.has(eventKey)) {
            this.observers.set(eventKey, new Map());
        }

        const eventObservers = this.observers.get(eventKey)!;

        if (eventObservers.size >= this.options.maxObservers) {
            throw new Error(
                `Maximum observers (${this.options.maxObservers}) reached for event: ${eventKey}`
            );
        }

        const observerId = options.observerId ?? this.generateObserverId();
        const metadata: ObserverMetadata = {
            id: observerId,
            priority: options.priority ?? 0,
            once: options.once ?? false,
            tags: options.tags ?? [],
        };

        eventObservers.set(observerId, {
            handler: handler as EventHandler,
            metadata,
            signal: options.signal,
        });

        return observerId;
    }

    protected removeObserverById(observerId: ObserverId): boolean {
        for (const [, eventObservers] of this.observers) {
            if (eventObservers.delete(observerId)) {
                return true;
            }
        }
        return false;
    }

    protected removeObserversByEventKey<TKey extends EventKeys<TEventMap>>(
        eventKey: TKey
    ): number {
        const eventObservers = this.observers.get(eventKey);
        if (!eventObservers) return 0;

        const count = eventObservers.size;
        eventObservers.clear();
        return count;
    }

    protected generateObserverId(): ObserverId {
        return `obs_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}` as ObserverId;
    }

    protected isObserverId(value: unknown): value is ObserverId {
        return typeof value === 'string' && value.startsWith('obs_');
    }

    protected handleError(
        error: unknown,
        eventKey: string,
        observerId: ObserverId
    ): void {
        switch (this.options.errorStrategy) {
            case 'throw':
                throw error;
            case 'log':
                console.error(`Observer error in ${eventKey}:`, error);
                break;
            case 'ignore':
                break;
        }
    }
}