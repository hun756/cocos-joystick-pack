import { EventTouch, Vec3 } from "cc";

export interface IJoystick {
    onTouchStart(event: EventTouch): void;
    onTouchMove(event: EventTouch): void;
    onTouchEnd(event: EventTouch): void;
    getDirection(): Vec3;
}