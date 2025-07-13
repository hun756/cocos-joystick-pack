import { _decorator, Node, EventTouch, Vec3 } from 'cc';
import { BaseJoystick } from './BaseJoystick';
import { JoystickEventMap, JoystickObservable } from './JoystickObservable';
import {
    IObservable,
    ObserverId,
    ConditionalEventHandler,
    PartialEventHandlerMap,
    ObserverOptions,
    ExtractEventType,
    EventMap,
} from '../Event/observer';
const { ccclass, property } = _decorator;

@ccclass('DynamicJoystick')
export class DynamicJoystick
    extends BaseJoystick
    implements IObservable<JoystickEventMap>
{
    @property(Node)
    protected stick: Node = null;

    @property(Node)
    protected ring: Node = null;

    private readonly _joystickObservable: JoystickObservable =
        new JoystickObservable('dynamic-joystick');

    public get id() {
        return this._joystickObservable.id;
    }

    protected handleTouchStart(event: EventTouch, touchId: number): boolean {
        const touchPos = this.getCanvasResolver().resolvePosition(event);

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

    private getCanvasResolver() {
        return this._canvasResolver;
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
