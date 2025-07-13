import { _decorator, Node, EventTouch, Vec3, UITransform, CCInteger, CCFloat } from "cc";
import { BaseJoystick } from "./BaseJoystick";
import { IObservable, ObserverId } from "../Event/observer";
import { JoystickEventMap, JoystickObservable } from "./JoystickObservable";
import { Range } from "../Runtime/decorators";
const { ccclass, property } = _decorator;

@ccclass("FollowJoystick")
export class FollowJoystick extends BaseJoystick implements IObservable<JoystickEventMap> {
    @property(Node)
    protected stick: Node = null;

    @property(Node)
    protected ring: Node = null;

    private joystickObservable: JoystickObservable = new JoystickObservable("follow-joystick");

    @property(CCInteger)
    private followThreshold: number = 25;

    @property(CCFloat)
    @Range(0.01, 0.25)
    private lerpSpeed: number = 0.1;

    get id() {
        return this.joystickObservable.id;
    }

    onTouchStart(event: EventTouch) {
        if (this.touchId === null) {
            const touch = event.touch;
            this.touchId = touch.getID();
            let touchPos = this.canvasResolver.resolvePosition(event);
            this.touchStartPos.set(touchPos);

            this.ring.setPosition(this.touchStartPos);
            this.stick.setPosition(this.touchStartPos);
            this.stickStartPos.set(this.stick.getPosition());

            this.updateStickPosition(event);
            this.joystickObservable.notifyStart(this.getDirection(), { ring: this.ring, stick: this.stick });
        }
    }

    onTouchMove(event: EventTouch) {
        if (this.touchId !== null && event.touch.getID() === this.touchId) {
            this.updateStickPosition(event);
            this.followFinger(event);
            this.joystickObservable.notifyMove(this.getDirection(), { ring: this.ring, stick: this.stick });
        }
    }

    onTouchEnd(event: EventTouch) {
        if (event.touch.getID() === this.touchId) {
            this.touchId = null;
            this.direction.set(new Vec3(0, 0, 0));
            this.joystickObservable.notifyEnd(this.getDirection(), { ring: this.ring, stick: this.stick });
        }
    }

    getDirection(): Vec3 {
        return this.direction;
    }

    private followFinger(event: EventTouch) {
        let touchPos = this.canvasResolver.resolvePosition(event);
        const distance = Vec3.distance(this.touchStartPos, touchPos);

        if (distance > this.radius + this.followThreshold) {
            const newPos = new Vec3();
            Vec3.lerp(newPos, this.ring.getPosition(), touchPos, this.lerpSpeed);
            const calculateStickPosition = Vec3.subtract(new Vec3(), this.stick.position, this.ring.position);
            this.ring.setPosition(newPos);
            this.stick.setPosition(Vec3.add(new Vec3(), newPos, calculateStickPosition));
            this.touchStartPos.set(newPos);
        }
    }

    // IObservable interface methods - delegate to internal observable
    subscribe<TKey extends string>(
        eventKey: TKey,
        handler: import("../Event/observer").ConditionalEventHandler<JoystickEventMap, TKey>,
        options?: import("../Event/observer").ObserverOptions
    ): ObserverId;
    subscribe<TKey extends string>(
        handlers: Pick<import("../Event/observer").PartialEventHandlerMap<JoystickEventMap>, TKey>,
        options?: import("../Event/observer").ObserverOptions
    ): ObserverId;
    subscribe<TKey extends string>(
        eventKeyOrHandlers: TKey | Pick<import("../Event/observer").PartialEventHandlerMap<JoystickEventMap>, TKey>,
        handlerOrOptions?: import("../Event/observer").ConditionalEventHandler<JoystickEventMap, TKey> | import("../Event/observer").ObserverOptions,
        options?: import("../Event/observer").ObserverOptions
    ): ObserverId {
        return this.joystickObservable.subscribe(eventKeyOrHandlers as any, handlerOrOptions as any, options);
    }

    unsubscribe(observerId: ObserverId): boolean;
    unsubscribe<TKey extends string>(eventKey: TKey): number;
    unsubscribe(): void;
    unsubscribe(observerIdOrEventKey?: ObserverId | string): boolean | number | void {
        return this.joystickObservable.unsubscribe(observerIdOrEventKey as any);
    }

    async emit<TKey extends string>(
        eventKey: TKey,
        data: import("../Event/observer").ExtractEventType<JoystickEventMap[TKey]>,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        return this.joystickObservable.emit(eventKey as any, data, metadata);
    }

    hasObservers<TKey extends string>(eventKey: TKey): boolean {
        return this.joystickObservable.hasObservers(eventKey as any);
    }

    getObserverCount<TKey extends string>(eventKey: TKey): number {
        return this.joystickObservable.getObserverCount(eventKey as any);
    }

    pipe<TTargetEventMap extends import("../Event/observer").EventMap>(
        target: IObservable<TTargetEventMap>,
        eventMapping?: Partial<Record<string, string>>
    ): () => void {
        return this.joystickObservable.pipe(target, eventMapping as any);
    }
}
