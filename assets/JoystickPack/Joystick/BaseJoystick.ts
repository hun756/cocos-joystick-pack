import { Component, EventTouch, Node, UITransform, Vec3 } from 'cc';
import { IJoystick, IJoystickConfig, IJoystickState } from './IJoystick';
import { CanvasResolver } from './CanvasResolver';
import { TouchEvents } from './TouchEvents';
import { JoystickConfig } from './JoystickConfig';
import { JoystickState } from './JoystickState';
import { TouchInputValidator } from './TouchInputValidator';
import { JoystickMath } from './JoystickMath';

export abstract class BaseJoystick extends Component implements IJoystick {
    protected stick: Node | null = null;
    protected ring: Node | null = null;

    private readonly _touchStartPos: Vec3 = new Vec3();
    private readonly _stickStartPos: Vec3 = new Vec3();
    private readonly _config: JoystickConfig = JoystickConfig.create();
    private readonly _state: JoystickState = new JoystickState();

    private _touchEvents: TouchEvents | null = null;
    protected _canvasResolver: CanvasResolver | null = null;
    private _isInitialized: boolean = false;

    protected onLoad(): void {
        this.initializeComponents();
        this.registerTouchEvents();
        this._isInitialized = true;
    }

    protected onDestroy(): void {
        this.cleanup();
    }

    public configure(config: Partial<IJoystickConfig>): void {
        const newConfig = this._config.update(config);
        Object.assign(this._config, newConfig);
    }

    public reset(): void {
        this._state.reset();
        this.resetVisualElements();
    }

    public onTouchStart(event: EventTouch): boolean {
        try {
            TouchInputValidator.validateTouchEvent(event, 'TouchStart');

            if (this._state.isActive) {
                return false;
            }

            const touchId = event.touch.getID();
            if (!TouchInputValidator.isValidTouchId(touchId)) {
                return false;
            }

            return this.handleTouchStart(event, touchId);
        } catch (error) {
            console.error('Error in onTouchStart:', error);
            return false;
        }
    }

    public onTouchMove(event: EventTouch): boolean {
        try {
            TouchInputValidator.validateTouchEvent(event, 'TouchMove');

            if (
                !TouchInputValidator.isSameTouchId(event, this._state.touchId)
            ) {
                return false;
            }

            return this.handleTouchMove(event);
        } catch (error) {
            console.error('Error in onTouchMove:', error);
            return false;
        }
    }

    public onTouchEnd(event: EventTouch): boolean {
        try {
            if (
                !TouchInputValidator.isSameTouchId(event, this._state.touchId)
            ) {
                return false;
            }

            return this.handleTouchEnd(event);
        } catch (error) {
            console.error('Error in onTouchEnd:', error);
            return false;
        }
    }

    public onTouchCancel(event: EventTouch): boolean {
        return this.onTouchEnd(event);
    }

    public getDirection(): Readonly<Vec3> {
        return this._state.direction;
    }

    public getMagnitude(): number {
        return this._state.magnitude;
    }

    public isActive(): boolean {
        return this._state.isActive;
    }

    public getState(): JoystickState {
        return this._state;
    }

    protected abstract handleTouchStart(
        event: EventTouch,
        touchId: number
    ): boolean;
    protected abstract handleTouchMove(event: EventTouch): boolean;
    protected abstract handleTouchEnd(event: EventTouch): boolean;

    protected updateStickPosition(event: EventTouch): void {
        if (!this.ensureInitialized()) {
            return;
        }

        const touchPos = this._canvasResolver!.resolvePosition(event);
        const result = JoystickMath.calculateDirection(
            touchPos,
            this._touchStartPos,
            this._config.radius,
            this._config.deadZone
        );

        const stickPos = JoystickMath.calculateStickPosition(
            touchPos,
            this._touchStartPos,
            this._config.radius
        );

        this.stick?.setPosition(stickPos);
        this._state.update(
            result.direction,
            result.magnitude,
            true,
            this._state.touchId
        );
    }

    protected get config(): JoystickConfig {
        return this._config;
    }

    protected get touchStartPos(): Readonly<Vec3> {
        return this._touchStartPos;
    }

    protected get stickStartPos(): Readonly<Vec3> {
        return this._stickStartPos;
    }

    protected setTouchStartPos(pos: Readonly<Vec3>): void {
        this._touchStartPos.set(pos);
    }

    protected setStickStartPos(pos: Readonly<Vec3>): void {
        this._stickStartPos.set(pos);
    }

    private initializeComponents(): void {
        this.validateRequiredNodes();
        this.initializeCanvasResolver();
        this.initializeRadius();
    }

    private validateRequiredNodes(): void {
        if (!this.stick) {
            throw new Error('Joystick stick node is required');
        }
        if (!this.ring) {
            throw new Error('Joystick ring node is required');
        }
    }

    private initializeCanvasResolver(): void {
        this._canvasResolver = this.node.getComponent(CanvasResolver);
        if (!this._canvasResolver) {
            this._canvasResolver = this.node.addComponent(CanvasResolver);
        }
    }

    private initializeRadius(): void {
        const ringTransform = this.ring?.getComponent(UITransform);
        if (
            ringTransform &&
            this._config.radius === JoystickConfig.getDefault().radius
        ) {
            this.configure({ radius: ringTransform.width * 0.5 });
        }
    }

    private registerTouchEvents(): void {
        this._touchEvents = new TouchEvents(this.node);
        this._touchEvents.register([
            [Node.EventType.TOUCH_START, this.onTouchStart.bind(this)],
            [Node.EventType.TOUCH_MOVE, this.onTouchMove.bind(this)],
            [Node.EventType.TOUCH_END, this.onTouchEnd.bind(this)],
            [Node.EventType.TOUCH_CANCEL, this.onTouchCancel.bind(this)],
        ]);
    }

    private resetVisualElements(): void {
        if (this.stick && this._stickStartPos) {
            this.stick.setPosition(this._stickStartPos);
        }
    }

    private ensureInitialized(): boolean {
        if (!this._isInitialized) {
            console.warn('BaseJoystick not properly initialized');
            return false;
        }

        if (!this._canvasResolver?.isInitialized) {
            console.warn('CanvasResolver not properly initialized');
            return false;
        }

        return true;
    }

    private cleanup(): void {
        this._touchEvents?.unregisterAll();
        this._state.reset();
        this._isInitialized = false;
    }
}
