import {
    EventMap,
    EventPayload,
    SubjectOptions,
    FilterEventMap,
    MapEventTypes,
    MergeEventMaps,
    NestedEventMap
} from './types';
import { BaseObservable } from './base';

export class Observable<
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
            create: <TPrefix extends string = ''>(
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
                [K in keyof TOther]: TOther[K] extends Observable<infer U>
                    ? U
                    : never;
            }>
    > {
        type MergedEventMap = TEventMap &
            MergeEventMaps<{
                [K in keyof TOther]: TOther[K] extends Observable<infer U>
                    ? U
                    : never;
            }>;

        const merged = new Observable<MergedEventMap>(
            `merged_${[this.id, ...others.map((o) => o.id)].join('_')}`,
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