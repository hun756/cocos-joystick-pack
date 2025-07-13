import { _decorator, Node, EventTouch, Vec3, CCInteger, CCFloat } from 'cc';
import { BaseJoystick } from './BaseJoystick';
import {
    IObservable,
    ObserverId,
    ConditionalEventHandler,
    PartialEventHandlerMap,
    ObserverOptions,
    ExtractEventType,
    EventMap,
} from '../Event/observer';
import { JoystickEventMap, JoystickObservable } from './JoystickObservable';
import { JoystickMath } from './JoystickMath';
import { Range } from '../Runtime/decorators';
const { ccclass, property } = _decorator;

@ccclass('FollowJoystick')
export class FollowJoystick
    extends BaseJoystick
    implements IObservable<JoystickEventMap>
{
    @property(Node)
    protected stick: Node = null;

    @property(Node)
    protected ring: Node = null;

    @property(CCInteger)
    private followThreshold: number = 25;

    @property(CCFloat)
    @Range(0.01, 0.25)
    private lerpSpeed: number = 0.1;

    private readonly _joystickObservable: JoystickObservable =
        new JoystickObservable('follow-joystick');

    public get id() {
        return this._joystickObservable.id;
    }

    protected handleTouchStart(event: EventTouch, touchId: number): boolean {
        const touchPos = this._canvasResolver!.resolvePosition(event);

        this.setTouchStartPos(touchPos);
        this.positionJoystickElements(touchPos);
        this.setStickStartPos(this.stick.getPosition());

        this.updateStickPosition(event);
        this.getState().update(
            this.getDirection(),
            this.getMagnitude(),
            true,
            touchId
        );

        this._joystickObservable.notifyStart(this.getDirection(), {
            ring: this.ring,
            stick: this.stick,
        });

        return true;
    }

    protected handleTouchMove(event: EventTouch): boolean {
        this.updateStickPosition(event);
        this.updateFollowBehavior(event);

        this._joystickObservable.notifyMove(this.getDirection(), {
            ring: this.ring,
            stick: this.stick,
        });

        return true;
    }

    protected handleTouchEnd(event: EventTouch): boolean {
        this.getState().update(new Vec3(0, 0, 0), 0, false, null);

        this._joystickObservable.notifyEnd(this.getDirection(), {
            ring: this.ring,
            stick: this.stick,
        });

        return true;
    }

    private positionJoystickElements(position: Readonly<Vec3>): void {
        this.ring.setPosition(position);
        this.stick.setPosition(position);
    }

    private updateFollowBehavior(event: EventTouch): void {
        const touchPos = this._canvasResolver!.resolvePosition(event);
        const distance = Vec3.distance(this.touchStartPos, touchPos);
        const threshold = this.config.radius + this.followThreshold;

        if (distance > threshold) {
            this.smoothFollowTouch(touchPos);
        }
    }

    private smoothFollowTouch(touchPos: Readonly<Vec3>): void {
        const currentRingPos = this.ring.getPosition();
        const newRingPos = new Vec3();
        Vec3.lerp(newRingPos, currentRingPos, touchPos, this.lerpSpeed);

        const stickOffset = Vec3.subtract(
            new Vec3(),
            this.stick.position,
            currentRingPos
        );
        const newStickPos = Vec3.add(new Vec3(), newRingPos, stickOffset);

        this.ring.setPosition(newRingPos);
        this.stick.setPosition(newStickPos);
        this.setTouchStartPos(newRingPos);
    }

    public subscribe<TKey extends string>(
        eventKey: TKey,
        handler: ConditionalEventHandler<JoystickEventMap, TKey>,
        options?: ObserverOptions
    ): ObserverId;
    public subscribe<TKey extends string>(
        handlers: Pick<PartialEventHandlerMap<JoystickEventMap>, TKey>,
        options?: ObserverOptions
    ): ObserverId;
    public subscribe<TKey extends string>(
        eventKeyOrHandlers:
            | TKey
            | Pick<PartialEventHandlerMap<JoystickEventMap>, TKey>,
        handlerOrOptions?:
            | ConditionalEventHandler<JoystickEventMap, TKey>
            | ObserverOptions,
        options?: ObserverOptions
    ): ObserverId {
        return this._joystickObservable.subscribe(
            eventKeyOrHandlers as any,
            handlerOrOptions as any,
            options
        );
    }

    public unsubscribe(observerId: ObserverId): boolean;
    public unsubscribe<TKey extends string>(eventKey: TKey): number;
    public unsubscribe(): void;
    public unsubscribe(
        observerIdOrEventKey?: ObserverId | string
    ): boolean | number | void {
        return this._joystickObservable.unsubscribe(
            observerIdOrEventKey as any
        );
    }

    public async emit<TKey extends string>(
        eventKey: TKey,
        data: ExtractEventType<JoystickEventMap[TKey]>,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        return this._joystickObservable.emit(eventKey as any, data, metadata);
    }

    public hasObservers<TKey extends string>(eventKey: TKey): boolean {
        return this._joystickObservable.hasObservers(eventKey as any);
    }

    public getObserverCount<TKey extends string>(eventKey: TKey): number {
        return this._joystickObservable.getObserverCount(eventKey as any);
    }

    public pipe<TTargetEventMap extends EventMap>(
        target: IObservable<TTargetEventMap>,
        eventMapping?: Partial<Record<string, string>>
    ): () => void {
        return this._joystickObservable.pipe(target, eventMapping as any);
    }
}
