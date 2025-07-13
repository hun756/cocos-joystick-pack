import { _decorator, Component, Node } from 'cc';
import { FollowJoystick } from './FollowJoystick';
import { ObserverId } from '../Event/observer';
import { JoystickEventMap } from './JoystickObservable';
const { ccclass, property } = _decorator;

@ccclass('JoystickEventHandler')
export class JoystickEventHandler extends Component {
    @property(FollowJoystick)
    private joystick: FollowJoystick = null;

    private readonly _observerIds: Set<ObserverId> = new Set();

    protected onLoad(): void {
        this.validateDependencies();
        this.subscribeToEvents();
    }

    protected onDestroy(): void {
        this.unsubscribeFromEvents();
    }

    private validateDependencies(): void {
        if (!this.joystick) {
            throw new Error(
                'JoystickEventHandler requires a valid joystick reference'
            );
        }
    }

    private subscribeToEvents(): void {
        const startObserverId = this.joystick.subscribe(
            'joystick:start',
            (event) =>
                this.handleJoystickStart(
                    event.data.parts.ring,
                    event.data.parts.stick
                )
        );

        const endObserverId = this.joystick.subscribe('joystick:end', (event) =>
            this.handleJoystickEnd(
                event.data.parts.ring,
                event.data.parts.stick
            )
        );

        this._observerIds.add(startObserverId);
        this._observerIds.add(endObserverId);
    }

    private unsubscribeFromEvents(): void {
        for (const observerId of this._observerIds) {
            this.joystick.unsubscribe(observerId);
        }
        this._observerIds.clear();
    }

    private handleJoystickStart(ring: Node, stick: Node): void {
        this.setJoystickVisibility(ring, stick, true);
    }

    private handleJoystickEnd(ring: Node, stick: Node): void {
        this.setJoystickVisibility(ring, stick, false);
    }

    private setJoystickVisibility(
        ring: Node,
        stick: Node,
        visible: boolean
    ): void {
        if (ring) {
            ring.active = visible;
        }
        if (stick) {
            stick.active = visible;
        }
    }
}
