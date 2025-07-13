import { Vec3, Node } from 'cc';
import { Observable, EventPayload } from '../Event/observer';

export interface JoystickParts {
    ring: Node;
    stick: Node;
}

export interface JoystickStartData {
    direction: Vec3;
    parts: JoystickParts;
}

export interface JoystickEndData {
    direction: Vec3;
    parts: JoystickParts;
}

export interface JoystickMoveData {
    direction: Vec3;
    parts: JoystickParts;
}

export interface JoystickEventMap {
    readonly 'joystick:start': EventPayload<JoystickStartData>;
    readonly 'joystick:end': EventPayload<JoystickEndData>;
    readonly 'joystick:move': EventPayload<JoystickMoveData>;
    readonly [key: string]: EventPayload<any>;
}

export class JoystickObservable extends Observable<JoystickEventMap> {
    constructor(id: string = 'joystick') {
        super(id);
    }

    async notifyStart(direction: Vec3, parts: JoystickParts): Promise<void> {
        await this.emit('joystick:start', { direction, parts });
    }

    async notifyEnd(direction: Vec3, parts: JoystickParts): Promise<void> {
        await this.emit('joystick:end', { direction, parts });
    }

    async notifyMove(direction: Vec3, parts: JoystickParts): Promise<void> {
        await this.emit('joystick:move', { direction, parts });
    }
}
