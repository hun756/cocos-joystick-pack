import { Node, Component } from 'cc';
import { IJoystick, IJoystickConfig } from './IJoystick';
import { DynamicJoystick } from './DynamicJoystick';
import { FollowJoystick } from './FollowJoystick';

export enum JoystickType {
    DYNAMIC = 'dynamic',
    FOLLOW = 'follow',
}

export interface JoystickFactoryConfig {
    readonly type: JoystickType;
    readonly stickNode: Node;
    readonly ringNode: Node;
    readonly config?: Partial<IJoystickConfig>;
}

export class JoystickFactory {
    public static create(
        parentNode: Node,
        factoryConfig: JoystickFactoryConfig
    ): IJoystick {
        this.validateFactoryConfig(factoryConfig);

        const joystick = this.createJoystickComponent(
            parentNode,
            factoryConfig.type
        );
        this.configureJoystick(joystick, factoryConfig);

        return joystick;
    }

    public static createDynamic(
        parentNode: Node,
        stickNode: Node,
        ringNode: Node,
        config?: Partial<IJoystickConfig>
    ): DynamicJoystick {
        return this.create(parentNode, {
            type: JoystickType.DYNAMIC,
            stickNode,
            ringNode,
            config,
        }) as DynamicJoystick;
    }

    public static createFollow(
        parentNode: Node,
        stickNode: Node,
        ringNode: Node,
        config?: Partial<IJoystickConfig>
    ): FollowJoystick {
        return this.create(parentNode, {
            type: JoystickType.FOLLOW,
            stickNode,
            ringNode,
            config,
        }) as FollowJoystick;
    }

    private static validateFactoryConfig(config: JoystickFactoryConfig): void {
        if (!config.stickNode) {
            throw new Error('Stick node is required');
        }
        if (!config.ringNode) {
            throw new Error('Ring node is required');
        }
        if (
            config.type !== JoystickType.DYNAMIC &&
            config.type !== JoystickType.FOLLOW
        ) {
            throw new Error(`Unsupported joystick type: ${config.type}`);
        }
    }

    private static createJoystickComponent(
        parentNode: Node,
        type: JoystickType
    ): Component & IJoystick {
        switch (type) {
            case JoystickType.DYNAMIC:
                return parentNode.addComponent(DynamicJoystick);
            case JoystickType.FOLLOW:
                return parentNode.addComponent(FollowJoystick);
            default:
                throw new Error(`Unsupported joystick type: ${type}`);
        }
    }

    private static configureJoystick(
        joystick: IJoystick,
        config: JoystickFactoryConfig
    ): void {
        const component = joystick as unknown as Component;

        this.setNodeProperty(component, 'stick', config.stickNode);
        this.setNodeProperty(component, 'ring', config.ringNode);

        if (config.config) {
            joystick.configure(config.config);
        }
    }

    private static setNodeProperty(
        component: Component,
        propertyName: string,
        node: Node
    ): void {
        const descriptor =
            Object.getOwnPropertyDescriptor(component, propertyName) ||
            Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(component),
                propertyName
            );

        if (descriptor?.set) {
            descriptor.set.call(component, node);
        } else {
            (component as any)[propertyName] = node;
        }
    }
}
