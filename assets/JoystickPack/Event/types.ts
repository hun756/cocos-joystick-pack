declare const __brand: unique symbol;
declare const __observerId: unique symbol;
declare const __eventKey: unique symbol;
declare const __subjectId: unique symbol;

export type Brand<T, B> = T & { readonly [__brand]: B };
export type ObserverId = Brand<string, typeof __observerId>;
export type EventKey<T extends string = string> = Brand<T, typeof __eventKey>;
export type SubjectId = Brand<string, typeof __subjectId>;

export type Nominal<T, K extends string> = T & { readonly __nominal: K };

export interface ObserverMetadata {
    readonly id: ObserverId;
    readonly priority: number;
    readonly once: boolean;
    readonly tags: readonly string[];
}

export type EventPayload<T = unknown> = {
    readonly type: string;
    readonly timestamp: number;
    readonly data: T;
    readonly metadata?: Record<string, unknown>;
};

export type ExtractEventType<T> = T extends EventPayload<infer U> ? U : never;

export type EventMap = Record<string, EventPayload>;

export type EventKeys<T extends EventMap> = keyof T & string;

export type EventHandler<T extends EventPayload = EventPayload> = {
    (event: T): void | Promise<void>;
};

export type ConditionalEventHandler<
    TEventMap extends EventMap,
    TKey extends EventKeys<TEventMap>
> = TEventMap[TKey] extends EventPayload<infer TData>
    ? EventHandler<EventPayload<TData>>
    : never;

export type EventHandlerMap<TEventMap extends EventMap> = {
    readonly [K in EventKeys<TEventMap>]: ConditionalEventHandler<TEventMap, K>;
};

export type PartialEventHandlerMap<TEventMap extends EventMap> = {
    readonly [K in EventKeys<TEventMap>]?: ConditionalEventHandler<
        TEventMap,
        K
    >;
};

export type StrictEventMap<T> = T extends Record<infer K, EventPayload<infer U>>
    ? K extends string
        ? Record<K, EventPayload<U>>
        : never
    : never;

export type ValidatedEventMap<T extends Record<string, EventPayload>> = {
    readonly [K in keyof T]: T[K] extends EventPayload<infer U>
        ? EventPayload<U>
        : never;
};

export interface ObserverOptions {
    readonly priority?: number;
    readonly once?: boolean;
    readonly tags?: readonly string[];
    readonly passive?: boolean;
    readonly signal?: AbortSignal;
}

export interface SubjectOptions {
    readonly maxObservers?: number;
    readonly enableMetrics?: boolean;
    readonly batchUpdates?: boolean;
    readonly errorStrategy?: 'throw' | 'log' | 'ignore';
}

export type ObserverConstraint<TEventMap extends EventMap> = {
    readonly metadata: ObserverMetadata;
    readonly eventMap: TEventMap;
};

export type SubjectConstraint<TEventMap extends EventMap> = {
    readonly id: SubjectId;
    readonly eventMap: TEventMap;
    readonly options: SubjectOptions;
};

export type FilterEventMap<TEventMap extends EventMap, TFilter extends string> = {
    readonly [K in EventKeys<TEventMap> as K extends `${TFilter}${infer _}`
        ? K
        : never]: TEventMap[K];
};

export type MapEventTypes<
    TEventMap extends EventMap,
    TMapper extends Record<string, string>
> = {
    readonly [K in EventKeys<TEventMap> as K extends keyof TMapper
        ? TMapper[K]
        : K]: TEventMap[K];
};

export type MergeEventMaps<T extends readonly EventMap[]> = T extends readonly [
    infer First extends EventMap,
    ...infer Rest extends readonly EventMap[]
]
    ? First & MergeEventMaps<Rest>
    : {};

export type EventMapFromTemplate<T extends string> =
    T extends `${infer Prefix}:${infer Suffix}`
        ? Record<T, EventPayload<{ prefix: Prefix; suffix: Suffix }>>
        : Record<T, EventPayload<unknown>>;

export type NestedEventMap<
    T extends Record<string, unknown>,
    TPrefix extends string = ''
> = {
    readonly [K in keyof T as `${TPrefix}${K & string}`]: EventPayload<T[K]>;
};

export interface TypedEventMap {
    readonly [K: string]: EventPayload;
}
