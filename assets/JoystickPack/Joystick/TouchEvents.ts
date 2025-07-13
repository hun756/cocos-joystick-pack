import { NodeEventType, EventTouch, Node } from "cc";

export class TouchEvents {
    private readonly handlers: Map<NodeEventType, (event: EventTouch) => void> = new Map();

    constructor(private readonly node: Node) { }

    public register(eventTypeOrEvents: NodeEventType | Array<[NodeEventType, (event: EventTouch) => void]>, handler?: (event: EventTouch) => void) {
        if (Array.isArray(eventTypeOrEvents)) {
            for (const [eventType, handler] of eventTypeOrEvents) {
                this.handlers.set(eventType, handler);
                this.node.on(eventType, handler, this);
            }
        } else {
            this.handlers.set(eventTypeOrEvents, handler);
            this.node.on(eventTypeOrEvents, handler, this);
        }
    }

    public unregister(eventType: NodeEventType) {
        const handler = this.handlers.get(eventType);
        if (handler) {
            this.node.off(eventType, handler, this);
            this.handlers.delete(eventType);
        }
    }

    public registerAll() {
        for (const [eventType, handler] of this.handlers) {
            this.node.on(eventType, handler, this);
        }
    }

    public unregisterAll() {
        for (const [eventType, handler] of this.handlers) {
            this.node.off(eventType, handler, this);
        }
        this.handlers.clear();
    }
}
