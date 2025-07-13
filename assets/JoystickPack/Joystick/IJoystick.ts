import { EventTouch, Vec3 } from 'cc';

export interface IJoystickConfig {
    readonly radius?: number;
    readonly isDynamic?: boolean;
    readonly threshold?: number;
    readonly deadZone?: number;
}

export interface IJoystickState {
    readonly isActive: boolean;
    readonly direction: Readonly<Vec3>;
    readonly magnitude: number;
    readonly touchId: number | null;
    update?(
        direction: Readonly<Vec3>,
        magnitude: number,
        isActive: boolean,
        touchId: number | null
    ): void;
}

export interface IJoystickInput {
    onTouchStart(event: EventTouch): boolean;
    onTouchMove(event: EventTouch): boolean;
    onTouchEnd(event: EventTouch): boolean;
    onTouchCancel(event: EventTouch): boolean;
}

export interface IJoystickOutput {
    getDirection(): Readonly<Vec3>;
    getMagnitude(): number;
    isActive(): boolean;
    getState(): IJoystickState;
}

export interface IJoystick extends IJoystickInput, IJoystickOutput {
    configure(config: Partial<IJoystickConfig>): void;
    reset(): void;
}
