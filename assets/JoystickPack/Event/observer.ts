declare const __brand: unique symbol;
declare const __observerId: unique symbol;
declare const __eventKey: unique symbol;
declare const __subjectId: unique symbol;

type Brand<T, B> = T & { readonly [__brand]: B };
type ObserverId = Brand<string, typeof __observerId>;
type EventKey<T extends string = string> = Brand<T, typeof __eventKey>;
type SubjectId = Brand<string, typeof __subjectId>;

type Nominal<T, K extends string> = T & { readonly __nominal: K };

interface ObserverMetadata {
  readonly id: ObserverId;
  readonly priority: number;
  readonly once: boolean;
  readonly tags: readonly string[];
}

type EventPayload<T = unknown> = {
  readonly type: string;
  readonly timestamp: number;
  readonly data: T;
  readonly metadata?: Record<string, unknown>;
};

type ExtractEventType<T> = T extends EventPayload<infer U> ? U : never;

type EventMap = Record<string, EventPayload>;

type EventKeys<T extends EventMap> = keyof T & string;

type EventHandler<T extends EventPayload = EventPayload> = {
  (event: T): void | Promise<void>;
};

type ConditionalEventHandler<
  TEventMap extends EventMap,
  TKey extends EventKeys<TEventMap>
> = TEventMap[TKey] extends EventPayload<infer TData>
  ? EventHandler<EventPayload<TData>>
  : never;

type EventHandlerMap<TEventMap extends EventMap> = {
  readonly [K in EventKeys<TEventMap>]: ConditionalEventHandler<TEventMap, K>;
};

type PartialEventHandlerMap<TEventMap extends EventMap> = {
  readonly [K in EventKeys<TEventMap>]?: ConditionalEventHandler<TEventMap, K>;
};

type StrictEventMap<T> = T extends Record<infer K, EventPayload<infer U>>
  ? K extends string
    ? Record<K, EventPayload<U>>
    : never
  : never;

type ValidatedEventMap<T extends Record<string, EventPayload>> = {
  readonly [K in keyof T]: T[K] extends EventPayload<infer U>
    ? EventPayload<U>
    : never;
};

interface ObserverOptions {
  readonly priority?: number;
  readonly once?: boolean;
  readonly tags?: readonly string[];
  readonly passive?: boolean;
  readonly signal?: AbortSignal;
}

interface SubjectOptions {
  readonly maxObservers?: number;
  readonly enableMetrics?: boolean;
  readonly batchUpdates?: boolean;
  readonly errorStrategy?: "throw" | "log" | "ignore";
}

type ObserverConstraint<TEventMap extends EventMap> = {
  readonly metadata: ObserverMetadata;
  readonly eventMap: TEventMap;
};

type SubjectConstraint<TEventMap extends EventMap> = {
  readonly id: SubjectId;
  readonly eventMap: TEventMap;
  readonly options: SubjectOptions;
};

interface IObservable<TEventMap extends EventMap = EventMap> {
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

interface IObserver<TEventMap extends EventMap = EventMap> {
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

type FilterEventMap<TEventMap extends EventMap, TFilter extends string> = {
  readonly [K in EventKeys<TEventMap> as K extends `${TFilter}${infer _}`
    ? K
    : never]: TEventMap[K];
};

type MapEventTypes<
  TEventMap extends EventMap,
  TMapper extends Record<string, string>
> = {
  readonly [K in EventKeys<TEventMap> as K extends keyof TMapper
    ? TMapper[K]
    : K]: TEventMap[K];
};

type MergeEventMaps<T extends readonly EventMap[]> = T extends readonly [
  infer First extends EventMap,
  ...infer Rest extends readonly EventMap[]
]
  ? First & MergeEventMaps<Rest>
  : {};

type EventMapFromTemplate<T extends string> =
  T extends `${infer Prefix}:${infer Suffix}`
    ? Record<T, EventPayload<{ prefix: Prefix; suffix: Suffix }>>
    : Record<T, EventPayload<unknown>>;

type NestedEventMap<
  T extends Record<string, unknown>,
  TPrefix extends string = ""
> = {
  readonly [K in keyof T as `${TPrefix}${K & string}`]: EventPayload<T[K]>;
};

abstract class BaseObservable<TEventMap extends EventMap>
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
      errorStrategy: options.errorStrategy ?? "throw",
    };
  }

  subscribe<TKey extends EventKeys<TEventMap>>(
    eventKeyOrHandlers: TKey | Pick<PartialEventHandlerMap<TEventMap>, TKey>,
    handlerOrOptions?:
      | ConditionalEventHandler<TEventMap, TKey>
      | ObserverOptions,
    options?: ObserverOptions
  ): ObserverId {
    if (typeof eventKeyOrHandlers === "string") {
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
          this.addObserver(eventKey as TKey, handler, { ...opts, observerId });
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

    for (const [observerId, { handler, metadata, signal }] of sortedObservers) {
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

  getObserverCount<TKey extends EventKeys<TEventMap>>(eventKey: TKey): number {
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
      const targetEvent = eventMapping?.[sourceEvent] ?? (sourceEvent as any);

      const observerId = this.subscribe(sourceEvent, (async (event) => {
        await target.emit(targetEvent, event.data as any, event.metadata);
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
    return typeof value === "string" && value.startsWith("obs_");
  }

  protected handleError(
    error: unknown,
    eventKey: string,
    observerId: ObserverId
  ): void {
    switch (this.options.errorStrategy) {
      case "throw":
        throw error;
      case "log":
        console.error(`Observer error in ${eventKey}:`, error);
        break;
      case "ignore":
        break;
    }
  }
}

class Observable<
  TEventMap extends EventMap = Record<string, EventPayload>
> extends BaseObservable<TEventMap> {
  static create<T extends EventMap>(
    id: string,
    options?: SubjectOptions
  ): Observable<T> {
    return new Observable<T>(id, options);
  }

  static typed<T extends Record<string, unknown>>() {
    return {
      create: <TPrefix extends string = "">(
        id: string,
        options?: SubjectOptions
      ): Observable<NestedEventMap<T, TPrefix>> => {
        return new Observable<NestedEventMap<T, TPrefix>>(id, options);
      },
    };
  }

  filter<TFilter extends string>(
    filter: TFilter
  ): Observable<FilterEventMap<TEventMap, TFilter>> {
    const filtered = new Observable<FilterEventMap<TEventMap, TFilter>>(
      `${this.id}_filtered_${filter}`,
      this.options
    );

    this.pipe(
      filtered as any,
      Array.from(this.observers.keys())
        .filter((key) => key.startsWith(filter))
        .reduce((acc, key) => {
          acc[key] = key;
          return acc;
        }, {} as any)
    );

    return filtered;
  }

  map<TMapper extends Record<string, string>>(
    mapper: TMapper
  ): Observable<MapEventTypes<TEventMap, TMapper>> {
    const mapped = new Observable<MapEventTypes<TEventMap, TMapper>>(
      `${this.id}_mapped`,
      this.options
    );

    this.pipe(mapped as any, mapper as any);

    return mapped;
  }

  merge<TOther extends readonly Observable<EventMap>[]>(
    ...others: TOther
  ): Observable<
    TEventMap &
      MergeEventMaps<{
        [K in keyof TOther]: TOther[K] extends Observable<infer U> ? U : never;
      }>
  > {
    type MergedEventMap = TEventMap &
      MergeEventMaps<{
        [K in keyof TOther]: TOther[K] extends Observable<infer U> ? U : never;
      }>;

    const merged = new Observable<MergedEventMap>(
      `merged_${[this.id, ...others.map((o) => o.id)].join("_")}`,
      this.options
    );

    const cleanup: (() => void)[] = [];

    cleanup.push(this.pipe(merged as any));
    others.forEach((other) => {
      cleanup.push(other.pipe(merged as any));
    });

    return Object.assign(merged, {
      dispose: () => cleanup.forEach((fn) => fn()),
    });
  }
}

class Observer<TEventMap extends EventMap = EventMap>
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
    eventKeyOrHandlers: TKey | Pick<PartialEventHandlerMap<TEventMap>, TKey>,
    handler?: ConditionalEventHandler<TEventMap, TKey>
  ): void {
    if (!this.subscriptions.has(subject)) {
      this.subscriptions.set(subject, new Map());
    }

    const subjectSubscriptions = this.subscriptions.get(subject)!;

    if (typeof eventKeyOrHandlers === "string" && handler) {
      const eventKey = eventKeyOrHandlers;
      const observerId = subject.subscribe(eventKey, handler);
      subjectSubscriptions.set(eventKey, observerId);
    } else if (typeof eventKeyOrHandlers === "object") {
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

interface TypedEventMap {
  readonly [K: string]: EventPayload;
}

type TypedObservable<T extends TypedEventMap> = Observable<T>;
type TypedObserver<T extends TypedEventMap> = Observer<T>;

function createObservable<
  T extends TypedEventMap = Record<string, EventPayload>
>(id: string, options?: SubjectOptions): TypedObservable<T> {
  return Observable.create<T>(id, options);
}

function createObserver<T extends TypedEventMap = Record<string, EventPayload>>(
  id: string,
  options?: ObserverOptions
): TypedObserver<T> {
  return Observer.create<T>(id, options);
}

function isObservable<T extends EventMap>(
  value: unknown
): value is IObservable<T> {
  return (
    value != null &&
    typeof value === "object" &&
    "id" in value &&
    "subscribe" in value &&
    "emit" in value
  );
}

function isObserver<T extends EventMap>(value: unknown): value is IObserver<T> {
  return (
    value != null &&
    typeof value === "object" &&
    "id" in value &&
    "metadata" in value &&
    "observe" in value
  );
}

type EventKeyOf<T> = T extends IObservable<infer U> ? EventKeys<U> : never;
type EventDataOf<T, K> = T extends IObservable<infer U>
  ? K extends EventKeys<U>
    ? ExtractEventType<U[K]>
    : never
  : never;

namespace ObserverPattern {
  export type EventMap = import("./observer").EventMap;
  export type Observable<T extends EventMap = EventMap> =
    import("./observer").Observable<T>;
  export type Observer<T extends EventMap = EventMap> =
    import("./observer").Observer<T>;
  export type EventPayload<T = unknown> = import("./observer").EventPayload<T>;
  export type ObserverId = import("./observer").ObserverId;
  export type SubjectId = import("./observer").SubjectId;

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

export {
  type EventMap,
  type EventPayload,
  type EventHandler,
  type EventKeys,
  type EventKeyOf,
  type EventDataOf,
  type ObserverId,
  type SubjectId,
  type ObserverMetadata,
  type ObserverOptions,
  type SubjectOptions,
  type IObservable,
  type IObserver,
  type TypedObservable,
  type TypedObserver,
  type TypedEventMap,
  type FilterEventMap,
  type MapEventTypes,
  type MergeEventMaps,
  type NestedEventMap,
  type ConditionalEventHandler,
  type EventHandlerMap,
  type PartialEventHandlerMap,
  type ExtractEventType,
  Observable,
  Observer,
  createObservable,
  createObserver,
  isObservable,
  isObserver,
  ObserverPattern,
};
