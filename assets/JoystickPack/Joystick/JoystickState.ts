import { Vec3 } from 'cc';
import { IJoystickState } from './IJoystick';

export class JoystickState implements IJoystickState {
    private readonly _direction: Vec3 = new Vec3();
    private _isActive: boolean = false;
    private _magnitude: number = 0;
    private _touchId: number | null = null;

    public update(
        direction: Readonly<Vec3>,
        magnitude: number,
        isActive: boolean,
        touchId: number | null = null
    ): void {
        this._direction.set(direction);
        this._magnitude = Math.max(0, Math.min(1, magnitude));
        this._isActive = isActive;
        this._touchId = touchId;
    }

    public reset(): void {
        this._direction.set(Vec3.ZERO);
        this._magnitude = 0;
        this._isActive = false;
        this._touchId = null;
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    public get direction(): Readonly<Vec3> {
        return this._direction.clone();
    }

    public get magnitude(): number {
        return this._magnitude;
    }

    public get touchId(): number | null {
        return this._touchId;
    }

    public equals(other: IJoystickState): boolean {
        return (
            this._isActive === other.isActive &&
            this._magnitude === other.magnitude &&
            this._touchId === other.touchId &&
            this._direction.equals(other.direction as Vec3)
        );
    }

    public clone(): JoystickState {
        const clone = new JoystickState();
        clone.update(
            this._direction,
            this._magnitude,
            this._isActive,
            this._touchId
        );
        return clone;
    }

    public toString(): string {
        return `JoystickState(active: ${
            this._isActive
        }, magnitude: ${this._magnitude.toFixed(
            3
        )}, direction: ${this._direction.toString()})`;
    }
}
