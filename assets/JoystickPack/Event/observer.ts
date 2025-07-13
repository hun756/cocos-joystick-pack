import {
    EventMap,
    EventKeys,
    ObserverId,
    ObserverMetadata,
    ObserverOptions,
    ConditionalEventHandler,
    PartialEventHandlerMap
} from './types';
import { IObservable, IObserver } from './interfaces';

export class Observer<TEventMap extends EventMap = EventMap>
    implements IObserver<TEventMap>
{
    readonly id: ObserverId;
    readonly metadata: ObserverMetadata;

    private readonly subscriptions = new Map<
        IObservable<TEventMap>,
        Map<EventKeys<TEventMap>, ObserverId>
    >();

    constructor(id: string, options: ObserverOptions = {}) {
        this.id = id as ObserverId;
        this.metadata = {
            id: this.id,
            priority: options.priority ?? 0,
            once: options.once ?? false,
            tags: options.tags ?? [],
        };
    }

    static create<T extends EventMap = EventMap>(
        id: string,
        options?: ObserverOptions
    ): Observer<T> {
        return new Observer<T>(id, options);
    }

    observe<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        eventKeyOrHandlers:
            | TKey
            | Pick<PartialEventHandlerMap<TEventMap>, TKey>,
        handler?: ConditionalEventHandler<TEventMap, TKey>
    ): void {
        if (!this.subscriptions.has(subject)) {
            this.subscriptions.set(subject, new Map());
        }

        const subjectSubscriptions = this.subscriptions.get(subject)!;

        if (typeof eventKeyOrHandlers === 'string' && handler) {
            const eventKey = eventKeyOrHandlers;
            const observerId = subject.subscribe(eventKey, handler);
            subjectSubscriptions.set(eventKey, observerId);
        } else if (typeof eventKeyOrHandlers === 'object') {
            const handlers = eventKeyOrHandlers;
            const observerId = subject.subscribe(handlers);

            for (const eventKey of Object.keys(handlers)) {
                subjectSubscriptions.set(eventKey as TKey, observerId);
            }
        }
    }

    unobserve(subject: IObservable<TEventMap>): void;
    unobserve<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        eventKey: TKey
    ): void;
    unobserve<TKey extends EventKeys<TEventMap>>(
        subject: IObservable<TEventMap>,
        eventKey?: TKey
    ): void {
        const subjectSubscriptions = this.subscriptions.get(subject);
        if (!subjectSubscriptions) return;

        if (eventKey) {
            const observerId = subjectSubscriptions.get(eventKey);
            if (observerId) {
                subject.unsubscribe(observerId);
                subjectSubscriptions.delete(eventKey);
            }
        } else {
            for (const observerId of subjectSubscriptions.values()) {
                subject.unsubscribe(observerId);
            }
            subjectSubscriptions.clear();
            this.subscriptions.delete(subject);
        }
    }

    isObserving(subject: IObservable<TEventMap>): boolean {
        return (
            this.subscriptions.has(subject) &&
            this.subscriptions.get(subject)!.size > 0
        );
    }

    getObservedSubjects(): readonly IObservable<TEventMap>[] {
        return Array.from(this.subscriptions.keys()).filter(
            (subject) => this.subscriptions.get(subject)!.size > 0
        );
    }

    dispose(): void {
        for (const subject of this.subscriptions.keys()) {
            this.unobserve(subject);
        }
        this.subscriptions.clear();
    }
}
