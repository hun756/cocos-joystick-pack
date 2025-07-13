import { _decorator, Node, EventTouch, director, Director, geometry, PhysicsSystem, PhysicsRayResult, Component, Collider } from 'cc';
const { ccclass } = _decorator;

// helper
function defineProperty(target: any, propertyKey: string, getter: () => any, setter: (newValue: any) => void) {
    Object.defineProperty(target, propertyKey, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true,
    });
}

/**
 * Decorator that ensures a property is never set to null or undefined.
 * 
 * @param target - The target object.
 * @param propertyKey - The name of the property.
 * @throws Will throw an error if the property is set to null or undefined.
 *
 * @example
 * class Player {
 *     @NotNull
 *     public name: string;
 *     
 *     constructor(name: string) {
 *         this.name = name;
 *     }
 * }
 * 
 * const player = new Player('John');
 * player.name = null; // Throws an error
 */
export function NotNull(target: any, propertyKey: string) {
    let value = target[propertyKey];

    const getter = () => value;
    const setter = (newVal: any) => {
        if (newVal === null || newVal === undefined) {
            throw new Error(`Property ${propertyKey} cannot be set to null or undefined`);
        }
        value = newVal;
    };

    defineProperty(target, propertyKey, getter, setter);
}

/**
 * Decorator that enforces a numeric property to be within a specified range.
 * 
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A property decorator function.
 * @throws Will throw an error if the property value is outside the specified range.
 *
 * @example
 * class GameSettings {
 *     @Range(1, 10)
 *     public difficulty: number;
 *     
 *     constructor(difficulty: number) {
 *         this.difficulty = difficulty;
 *     }
 * }
 * 
 * const settings = new GameSettings(5);
 * settings.difficulty = 11; // Throws an error
 */
export function Range(min: number, max: number) {
    return function (target: any, propertyKey: string) {
        let value = target[propertyKey];

        const getter = () => value;
        const setter = (newValue: number) => {
            if (newValue < min || newValue > max) {
                throw new Error(`Property ${propertyKey} must be between ${min} and ${max}.`);
            }
            value = newValue;
        };

        defineProperty(target, propertyKey, getter, setter);
    };
}

/**
 * Decorator that provides a default value for a property.
 * 
 * @param defaultValue - The default value to be assigned.
 * @returns A property decorator function.
 *
 * @example
 * class Settings {
 *     @Default('Guest')
 *     public username: string;
 *     
 *     constructor(username?: string) {
 *         this.username = username;
 *     }
 * }
 * 
 * const settings = new Settings();
 * console.log(settings.username); // Outputs 'Guest'
 */
export function Default(defaultValue: any) {
    return function (target: any, propertyKey: string) {
        let value = target[propertyKey] || defaultValue;

        const getter = () => value;
        const setter = (newValue: any) => {
            value = newValue !== undefined ? newValue : defaultValue;
        };

        defineProperty(target, propertyKey, getter, setter);
    };
}

/**
 * Decorator that throttles a method, ensuring it is only called once within a specified delay.
 * 
 * @param delay - The delay in milliseconds.
 * @returns A method decorator function.
 *
 * @example
 * class Game {
 *     @Throttle(1000)
 *     public shoot() {
 *         console.log('Shoot!');
 *     }
 * }
 * 
 * const game = new Game();
 * game.shoot(); // 'Shoot!' is logged
 * game.shoot(); // Ignored if called within 1 second
 */
export function Throttle(delay: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        let lastCall = 0;

        descriptor.value = function (...args: any[]) {
            const now = Date.now();
            if (now - lastCall < delay) return;
            lastCall = now;
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}


/**
 * Decorator that debounces a method, ensuring it is only called after a specified delay.
 * 
 * @param delay - The delay in milliseconds before the method is invoked.
 * @returns A method decorator function.
 *
 * @example
 * class Search {
 *     @Debounce(300)
 *     public performSearch(query: string) {
 *         console.log(`Searching for ${query}`);
 *     }
 * }
 * 
 * const searchInstance = new Search();
 * searchInstance.performSearch('test'); // The search will be performed after 300ms
 */
export function Debounce(delay: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        let timeoutId: ReturnType<typeof setTimeout>;

        descriptor.value = function (...args: any[]) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => originalMethod.apply(this, args), delay);
        };

        return descriptor;
    };
}

/**
 * Decorator that validates a property value using a custom validator function.
 * 
 * @param validatorFn - A function that validates the property value.
 * @param errorMessage - The error message to be thrown if validation fails.
 * @returns A property decorator function.
 * @throws Will throw an error if the property value is invalid.
 *
 * @example
 * class User {
 *     @Validate((value) => typeof value === 'string' && value.length > 3, 'Username must be a string with more than 3 characters.')
 *     public username: string;
 *     
 *     constructor(username: string) {
 *         this.username = username;
 *     }
 * }
 * 
 * const user = new User('JohnDoe');
 * user.username = 'JD'; // Throws an error
 */
export function Validate(validatorFn: (value: any) => boolean, errorMessage: string) {
    return function (target: any, propertyKey: string) {
        let value = target[propertyKey];

        const getter = () => value;
        const setter = (newValue: any) => {
            if (!validatorFn(newValue)) {
                throw new Error(errorMessage);
            }
            value = newValue;
        };

        defineProperty(target, propertyKey, getter, setter);
    };
}

/**
 * Decorator that restricts a property value to a set of allowed values.
 * 
 * @param allowedValues - The allowed values for the property.
 * @returns A property decorator function.
 * @throws Will throw an error if the property value is not in the allowed values.
 *
 * @example
 * class Settings {
 *     @EnumProperty('easy', 'medium', 'hard')
 *     public difficulty: string;
 *     
 *     constructor(difficulty: string) {
 *         this.difficulty = difficulty;
 *     }
 * }
 * 
 * const settings = new Settings('medium');
 * settings.difficulty = 'extreme'; // Throws an error
 */
export function EnumProperty(...allowedValues: any[]) {
    return function (target: any, propertyKey: string) {
        let value = target[propertyKey];

        const getter = () => value;
        const setter = (newValue: any) => {
            if (allowedValues.indexOf(newValue) === -1) {
                throw new Error(`Property ${propertyKey} must be one of: ${allowedValues.join(', ')}`);
            }
            value = newValue;
        };

        defineProperty(target, propertyKey, getter, setter);
    };
}


function addTouchEventListeners(node: Node, onTouchStart: (event: EventTouch) => void, onTouchEnd: () => void) {
    node.on(Node.EventType.TOUCH_START, onTouchStart, this);
    node.on(Node.EventType.TOUCH_END, onTouchEnd, this);
    node.on(Node.EventType.TOUCH_CANCEL, onTouchEnd, this);
}

function removeTouchEventListeners(node: Node, onTouchStart: (event: EventTouch) => void, onTouchEnd: () => void) {
    node.off(Node.EventType.TOUCH_START, onTouchStart, this);
    node.off(Node.EventType.TOUCH_END, onTouchEnd, this);
    node.off(Node.EventType.TOUCH_CANCEL, onTouchEnd, this);
}

/**
 * Decorator for detecting a long press (touch holding) on a node.
 * The decorated method will be called if the touch holding duration exceeds the specified time.
 * 
 * @param duration - The duration in milliseconds that constitutes a long press.
 * @returns A property decorator function.
 *
 * @example
 * class MyComponent extends Component {
 *     @TouchHoldingDetection(1000)
 *     onLongPress(event: EventTouch) {
 *         console.log('Long press detected', event);
 *     }
 * }
 * 
 * const myComponent = new MyComponent();
 * // Add MyComponent to a node in Cocos Creator to use the long press detection
 */
export function TouchHoldingDetection(duration: number) {
    return function (target: any, propertyKey: string) {
        let timeoutId: number;

        const onTouchStart = (event: EventTouch) => {
            timeoutId = setTimeout(() => {
                if (typeof target[propertyKey] === 'function') {
                    target[propertyKey].call(this, event);
                }
            }, duration);
        };

        const onTouchEnd = () => {
            clearTimeout(timeoutId);
        };

        const originalOnLoad = target.onLoad;
        target.onLoad = function () {
            if (originalOnLoad) {
                originalOnLoad.call(this);
            }
            addTouchEventListeners(this.node, onTouchStart, onTouchEnd);
        };

        const originalOnDestroy = target.onDestroy;
        target.onDestroy = function () {
            if (originalOnDestroy) {
                originalOnDestroy.call(this);
            }
            removeTouchEventListeners(this.node, onTouchStart, onTouchEnd);
        };
    };
}

/**
 * Decorator for executing a method when the scene is fully ready.
 * The decorated method will be called after the first frame is drawn.
 * 
 * @returns A property decorator function.
 *
 * @example
 * class GameController extends Component {
 *     @SceneReady()
 *     onSceneReady() {
 *         console.log('Scene is ready');
 *     }
 * }
 * 
 * const gameController = new GameController();
 * // Add GameController to a node in Cocos Creator to execute the method when the scene is ready
 */
export function SceneReady() {
    return function (target: any, propertyKey: string) {
        const originalOnLoad = target.onLoad;

        target.onLoad = function () {
            if (originalOnLoad) {
                originalOnLoad.call(this);
            }

            director.once(Director.EVENT_AFTER_DRAW, () => {
                if (typeof target[propertyKey] === 'function') {
                    target[propertyKey].call(this);
                }
            });
        };
    };
}

/**
 * Decorator for emitting a custom event after executing a method.
 * The event will be emitted from the node associated with the component.
 * 
 * @param eventName - The name of the event to emit.
 * @returns A method decorator function.
 *
 * @example
 * class Player extends Component {
 *     @EmitEvent('playerScored')
 *     score(points: number) {
 *         console.log(`Player scored ${points} points`);
 *     }
 * }
 * 
 * const player = new Player();
 * player.score(10); // Emits 'playerScored' event with points
 */
export function EmitEvent(eventName: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const result = originalMethod.apply(this, args);
            this.node.emit(eventName, ...args);
            return result;
        };

        return descriptor;
    };
}

/**
 * Decorator for detecting raycast hits when a touch starts on the node.
 * 
 * The decorated method will log the name of the node hit by the raycast.
 * 
 * @returns A property decorator function.
 *
 * @example
 * class MyComponent extends Component {
 *     @RaycastDetection()
 *     onRaycastHit() {
 *         // Method to handle raycast hits
 *     }
 * }
 * 
 * const myComponent = new MyComponent();
 * // Add MyComponent to a node in Cocos Creator to enable raycast detection
 */
export function RaycastDetection() {
    return function (target: any, propertyKey: string) {
        const onTouchStart = function (event: any) {
            const ray = new geometry.Ray();
            PhysicsSystem.instance.raycastClosest(ray);
            const result: PhysicsRayResult = PhysicsSystem.instance.raycastClosestResult;
            if (result) {
                console.log(`Raycast hit: ${result.collider.node.name}`);
            }
        };

        if (!target.onLoad) {
            target.onLoad = function () {
                this.node.on(Node.EventType.TOUCH_START, onTouchStart, this);
            };
        }

        if (!target.onDestroy) {
            target.onDestroy = function () {
                this.node.off(Node.EventType.TOUCH_START, onTouchStart, this);
            };
        }
    };
}

/**
 * Decorator for watching changes on a property and triggering a callback when the property value changes.
 * 
 * @param callback - The function to call when the property value changes.
 * @returns A property decorator function.
 *
 * @example
 * class Player {
 *     @WatchProperty((newValue, oldValue) => {
 *         console.log(`Player health changed from ${oldValue} to ${newValue}`);
 *     })
 *     public health: number;
 *     
 *     constructor(health: number) {
 *         this.health = health;
 *     }
 * }
 * 
 * const player = new Player(100);
 * player.health = 80; // Logs: Player health changed from 100 to 80
 */
export function WatchProperty(callback: (newValue: any, oldValue: any) => void) {
    return function (target: any, propertyKey: string) {
        let value = target[propertyKey];

        const getter = () => value;
        const setter = (newValue: any) => {
            const oldValue = value;
            value = newValue;
            callback(newValue, oldValue);
        };

        defineProperty(target, propertyKey, getter, setter);
    };
}

/**
 * Utility function to create a trigger decorator that handles collider events.
 * 
 * @param onEnter - Function to call when the collider enters the trigger.
 * @param onExit - Function to call when the collider exits the trigger.
 * @returns A method decorator function.
 *
 * @example
 * class Enemy extends Component {
 *     @colliderTrigger(
 *         (collider) => console.log('Collider entered:', collider),
 *         (collider) => console.log('Collider exited:', collider)
 *     )
 *     onColliderTrigger(collider: Collider) {
 *         // Method to handle collider trigger events
 *     }
 * }
 * 
 * const enemy = new Enemy();
 * // Add Enemy to a node with a Collider component in Cocos Creator to enable collider trigger detection
 */
function colliderTrigger(onEnter?: (collider: Collider) => void, onExit?: (collider: Collider) => void) {
    return function (target: Component, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const node = target.node;

        descriptor.value = function (...args: any[]) {
            if (node) {
                const collider = node.getComponent(Collider);
                if (collider) {
                    collider.on('onTriggerEnter', (otherCollider: Collider) => {
                        if (onEnter) {
                            onEnter(otherCollider);
                        }
                        originalMethod.call(this, otherCollider, ...args);
                    });

                    collider.on('onTriggerExit', (otherCollider: Collider) => {
                        if (onExit) {
                            onExit(otherCollider);
                        }
                    });
                } else {
                    console.warn("Collider component not found for trigger detection.");
                }
            } else {
                console.warn("Node reference not found for collider trigger.");
            }
        };
        return descriptor;
    };
}

type TriggerEvent = 'onTriggerEnter' | 'onTriggerStay' | 'onTriggerExit';

/**
 * Utility function to create a trigger event decorator.
 * 
 * @param event - The trigger event to listen for.
 * @returns A method decorator function.
 *
 * @example
 * class Obstacle extends Component {
 *     @OnTriggerEnter()
 *     handleTriggerEnter(otherCollider: Collider) {
 *         console.log('Trigger entered by:', otherCollider.node.name);
 *     }
 *     
 *     @OnTriggerStay()
 *     handleTriggerStay(otherCollider: Collider) {
 *         console.log('Trigger stayed by:', otherCollider.node.name);
 *     }
 *     
 *     @OnTriggerExit()
 *     handleTriggerExit(otherCollider: Collider) {
 *         console.log('Trigger exited by:', otherCollider.node.name);
 *     }
 * }
 * 
 * const obstacle = new Obstacle();
 * // Add Obstacle to a node with a Collider component in Cocos Creator to handle trigger events
 */
function createTriggerDecorator(event: TriggerEvent) {
    return function () {
        return function (target: Component, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;

            descriptor.value = function (...args: any[]) {
                const node = this.node;
                if (!node) {
                    console.warn(`Node reference not found for collider trigger in ${String(propertyKey)}.`);
                    return;
                }

                const collider = node.getComponent(Collider);
                if (!collider) {
                    console.warn(`Collider component not found for trigger detection in ${String(propertyKey)}.`);
                    return;
                }

                collider.on(event, (otherCollider: Collider) => {
                    originalMethod.call(this, otherCollider, ...args);
                });
            };

            return descriptor;
        };
    };
}

export const OnTriggerEnter = createTriggerDecorator('onTriggerEnter');
export const OnTriggerStay = createTriggerDecorator('onTriggerStay');
export const OnTriggerExit = createTriggerDecorator('onTriggerExit');
