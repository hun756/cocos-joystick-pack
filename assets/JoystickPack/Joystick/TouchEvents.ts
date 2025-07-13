import { NodeEventType, EventTouch, Node } from 'cc';

type TouchEventHandler = (event: EventTouch) => void;
type TouchEventEntry = [NodeEventType, TouchEventHandler];

export class TouchEvents {
    private readonly _handlers = new Map<NodeEventType, TouchEventHandler>();
    private readonly _node: Node;
    private _isRegistered: boolean = false;

    constructor(node: Node) {
        if (!node) {
            throw new Error('TouchEvents requires a valid Node instance');
        }
        this._node = node;
    }

    public register(eventType: NodeEventType, handler: TouchEventHandler): void;
    public register(events: ReadonlyArray<TouchEventEntry>): void;
    public register(
        eventTypeOrEvents: NodeEventType | ReadonlyArray<TouchEventEntry>,
        handler?: TouchEventHandler
    ): void {
        if (Array.isArray(eventTypeOrEvents)) {
            this.registerMultiple(eventTypeOrEvents);
        } else {
            if (!handler) {
                throw new Error(
                    'Handler is required when registering a single event type'
                );
            }
            this.registerSingle(eventTypeOrEvents as NodeEventType, handler);
        }
        this._isRegistered = true;
    }

    public unregister(eventType: NodeEventType): boolean {
        const handler = this._handlers.get(eventType);
        if (!handler) {
            return false;
        }

        this._node.off(eventType, handler, this);
        this._handlers.delete(eventType);
        return true;
    }

    public unregisterAll(): void {
        for (const [eventType, handler] of this._handlers) {
            this._node.off(eventType, handler, this);
        }
        this._handlers.clear();
        this._isRegistered = false;
    }

    public reregisterAll(): void {
        if (!this._isRegistered) {
            return;
        }

        for (const [eventType, handler] of this._handlers) {
            this._node.on(eventType, handler, this);
        }
    }

    public hasHandler(eventType: NodeEventType): boolean {
        return this._handlers.has(eventType);
    }

    public getHandlerCount(): number {
        return this._handlers.size;
    }

    public get isRegistered(): boolean {
        return this._isRegistered;
    }

    private registerSingle(
        eventType: NodeEventType,
        handler: TouchEventHandler
    ): void {
        if (!handler || typeof handler !== 'function') {
            throw new Error(
                `Invalid handler provided for event type: ${eventType}`
            );
        }

        if (this._handlers.has(eventType)) {
            this.unregister(eventType);
        }

        this._handlers.set(eventType, handler);
        this._node.on(eventType, handler, this);
    }

    private registerMultiple(events: ReadonlyArray<TouchEventEntry>): void {
        for (const [eventType, handler] of events) {
            this.registerSingle(eventType, handler);
        }
    }
}
