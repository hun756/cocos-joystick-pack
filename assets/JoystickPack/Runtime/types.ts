type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Dictionary<T> = { [key: string]: T };

type Result<T, E> =
    | { success: true, value: T }
    | { success: false, error: E };


type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

type Promisify<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : never;


