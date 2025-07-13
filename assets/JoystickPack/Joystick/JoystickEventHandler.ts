import { _decorator, Component, Node } from 'cc';
import { FollowJoystick } from './FollowJoystick';
import { Observer, ObserverId } from '../Event/observer';
import { JoystickEventMap } from './JoystickObservable';
const { ccclass, property } = _decorator;

@ccclass('JoystickEventHandler')
export class JoystickEventHandler extends Component {
    @property(FollowJoystick)
    private joystick: FollowJoystick = null;

    private startObserverId: ObserverId = null;
    private endObserverId: ObserverId = null;

    protected onLoad(): void {
        // Subscribe to joystick start events
        this.startObserverId = this.joystick.subscribe(
            "joystick:start",
            (event) => {
                this.showJoystickParts(event.data.parts.ring, event.data.parts.stick);
            }
        );

        // Subscribe to joystick end events  
        this.endObserverId = this.joystick.subscribe(
            "joystick:end",
            (event) => {
                this.hideJoystickParts(event.data.parts.ring, event.data.parts.stick);
            }
        );
    }

    protected onDestroy(): void {
        // Clean up subscriptions
        if (this.startObserverId) {
            this.joystick.unsubscribe(this.startObserverId);
        }
        if (this.endObserverId) {
            this.joystick.unsubscribe(this.endObserverId);
        }
    }

    private showJoystickParts(ring: Node, stick: Node) {
        ring.active = true;
        stick.active = true;
    }

    private hideJoystickParts(ring: Node, stick: Node) {
        ring.active = false;
        stick.active = false;
    }
}

