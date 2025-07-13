import { _decorator, Component, Node } from 'cc';
import {
    JoystickFactory,
    JoystickType,
    IJoystick,
    DynamicJoystick,
    FollowJoystick,
} from './index';
const { ccclass, property } = _decorator;

@ccclass('JoystickExampleUsage')
export class JoystickExampleUsage extends Component {
    @property(Node)
    private stickNode: Node = null;

    @property(Node)
    private ringNode: Node = null;

    private dynamicJoystick: DynamicJoystick | null = null;
    private followJoystick: FollowJoystick | null = null;

    protected onLoad(): void {
        this.createJoysticks();
        this.setupEventListeners();
    }

    protected onDestroy(): void {
        this.cleanupJoysticks();
    }

    private createJoysticks(): void {
        this.dynamicJoystick = JoystickFactory.createDynamic(
            this.node,
            this.stickNode,
            this.ringNode,
            {
                radius: 80,
                deadZone: 0.15,
            }
        );

        this.followJoystick = JoystickFactory.createFollow(
            this.node,
            this.stickNode,
            this.ringNode,
            {
                radius: 100,
                threshold: 30,
                deadZone: 0.1,
            }
        );
    }

    private setupEventListeners(): void {
        if (this.dynamicJoystick) {
            this.dynamicJoystick.subscribe('joystick:start', (event) => {
                console.log('Dynamic joystick started:', event.data.direction);
            });

            this.dynamicJoystick.subscribe('joystick:move', (event) => {
                console.log('Dynamic joystick moving:', event.data.direction);
            });

            this.dynamicJoystick.subscribe('joystick:end', (event) => {
                console.log('Dynamic joystick ended');
            });
        }

        if (this.followJoystick) {
            this.followJoystick.subscribe('joystick:move', (event) => {
                console.log('Follow joystick direction:', event.data.direction);
                console.log(
                    'Follow joystick magnitude:',
                    this.followJoystick.getMagnitude()
                );
            });
        }
    }

    private cleanupJoysticks(): void {
        this.dynamicJoystick?.reset();
        this.followJoystick?.reset();
    }

    public getCurrentDirection(): { x: number; y: number } {
        const activeJoystick = this.getActiveJoystick();
        if (!activeJoystick) {
            return { x: 0, y: 0 };
        }

        const direction = activeJoystick.getDirection();
        return { x: direction.x, y: direction.y };
    }

    public getMagnitude(): number {
        const activeJoystick = this.getActiveJoystick();
        return activeJoystick?.getMagnitude() || 0;
    }

    private getActiveJoystick(): IJoystick | null {
        if (this.dynamicJoystick?.isActive()) {
            return this.dynamicJoystick;
        }
        if (this.followJoystick?.isActive()) {
            return this.followJoystick;
        }
        return null;
    }
}
