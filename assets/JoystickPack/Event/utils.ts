import {
    EventMap,
    EventPayload,
    EventKeys,
    ObserverOptions,
    SubjectOptions,
    TypedEventMap,
    ExtractEventType
} from './types';
import { IObservable, IObserver } from './interfaces';
import { Observable } from './observable';
import { Observer } from './observer';

export function createObservable<
    T extends TypedEventMap = Record<string, EventPayload>
>(id: string, options?: SubjectOptions): Observable<T> {
    return Observable.create<T>(id, options);
}

export function createObserver<T extends TypedEventMap = Record<string, EventPayload>>(
    id: string,
    options?: ObserverOptions
): Observer<T> {
    return Observer.create<T>(id, options);
}

export function isObservable<T extends EventMap>(
    value: unknown
): value is IObservable<T> {
    return (
        value != null &&
        typeof value === 'object' &&
        'id' in value &&
        'subscribe' in value &&
        'emit' in value
    );
}

export function isObserver<T extends EventMap>(value: unknown): value is IObserver<T> {
    return (
        value != null &&
        typeof value === 'object' &&
        'id' in value &&
        'metadata' in value &&
        'observe' in value
    );
}

export type EventKeyOf<T> = T extends IObservable<infer U> ? EventKeys<U> : never;
export type EventDataOf<T, K> = T extends IObservable<infer U>
    ? K extends EventKeys<U>
        ? ExtractEventType<U[K]>
        : never
    : never;

export type TypedObservable<T extends TypedEventMap> = Observable<T>;
export type TypedObserver<T extends TypedEventMap> = Observer<T>;
