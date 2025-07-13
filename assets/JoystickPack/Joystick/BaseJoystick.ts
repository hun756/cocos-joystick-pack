import { Component, EventTouch, Node, UITransform, Vec3 } from "cc";
import { IJoystick } from "./IJoystick";
import { CanvasResolver } from "./CanvasResolver";
import { TouchEvents } from "./TouchEvents";

export abstract class BaseJoystick extends Component implements IJoystick {
    protected stick: Node;
    protected ring: Node;
    protected touchStartPos: Vec3 = new Vec3();
    protected stickStartPos: Vec3 = new Vec3();
    protected touchId: number = null;
    protected radius: number = 0;
    protected direction: Vec3 = new Vec3();
    protected isDynamic: boolean = true;
    protected touchEvents: TouchEvents;
    protected canvasResolver: CanvasResolver;

    abstract onTouchStart(event: EventTouch): void;
    abstract onTouchMove(event: EventTouch): void;
    abstract onTouchEnd(event: EventTouch): void;
    abstract getDirection(): Vec3;

    protected onLoad() {
        this.radius = this.ring.getComponent(UITransform).width / 2;
        this.canvasResolver = this.node.getComponent(CanvasResolver);
        if (!this.canvasResolver) {
            this.canvasResolver = this.node.addComponent(CanvasResolver);
        }

        this.touchEvents = new TouchEvents(this.node);
        this.touchEvents.register([
            [Node.EventType.TOUCH_START, this.onTouchStart.bind(this)],
            [Node.EventType.TOUCH_MOVE, this.onTouchMove.bind(this)],
            [Node.EventType.TOUCH_END, this.onTouchEnd.bind(this)],
            [Node.EventType.TOUCH_CANCEL, this.onTouchEnd.bind(this)]
        ]);
    }

    protected onDestroy() {
        this.touchEvents.unregisterAll();
    }

    protected updateStickPosition(event: EventTouch) {
        let touchPos = this.canvasResolver.resolvePosition(event);
        let delta = Vec3.subtract(new Vec3(), touchPos, this.touchStartPos);
        const distance = delta.length();
        const radius = this.radius;

        if (distance > radius) {
            delta = delta.normalize().multiplyScalar(radius);
        }

        const newPos = Vec3.add(new Vec3(), this.touchStartPos, delta);
        this.stick.setPosition(newPos);
        this.direction.set(delta.x / radius, delta.y / radius, 0);
    }
}
