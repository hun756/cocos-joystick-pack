import { EventTouch } from 'cc';

export class TouchInputValidator {
    public static isValidTouchEvent(event: EventTouch): boolean {
        return event && event.touch && typeof event.touch.getID === 'function';
    }

    public static isValidTouchId(touchId: number): boolean {
        return typeof touchId === 'number' && touchId >= 0;
    }

    public static isSameTouchId(
        event: EventTouch,
        expectedTouchId: number | null
    ): boolean {
        if (expectedTouchId === null) {
            return false;
        }

        if (!this.isValidTouchEvent(event)) {
            return false;
        }

        return event.touch.getID() === expectedTouchId;
    }

    public static validateTouchEvent(
        event: EventTouch,
        context: string = 'Touch event'
    ): void {
        if (!this.isValidTouchEvent(event)) {
            throw new Error(`${context}: Invalid touch event received`);
        }
    }
}
