import { Vec3 } from 'cc';

export class JoystickMath {
    private static readonly TEMP_VEC3 = new Vec3();

    public static calculateDirection(
        touchPos: Readonly<Vec3>,
        startPos: Readonly<Vec3>,
        radius: number,
        deadZone: number = 0
    ): { direction: Vec3; magnitude: number; clamped: boolean } {
        const delta = Vec3.subtract(this.TEMP_VEC3, touchPos, startPos);
        const distance = delta.length();

        if (distance <= deadZone * radius) {
            return {
                direction: new Vec3(0, 0, 0),
                magnitude: 0,
                clamped: false,
            };
        }

        const magnitude = Math.min(distance / radius, 1);
        const clamped = distance > radius;

        if (clamped) {
            delta.normalize().multiplyScalar(radius);
        }

        const normalizedDirection = new Vec3(
            delta.x / radius,
            delta.y / radius,
            0
        );

        return {
            direction: normalizedDirection,
            magnitude,
            clamped,
        };
    }

    public static calculateStickPosition(
        touchPos: Readonly<Vec3>,
        startPos: Readonly<Vec3>,
        radius: number
    ): Vec3 {
        const delta = Vec3.subtract(this.TEMP_VEC3, touchPos, startPos);
        const distance = delta.length();

        if (distance > radius) {
            delta.normalize().multiplyScalar(radius);
        }

        return Vec3.add(new Vec3(), startPos, delta);
    }

    public static isWithinRadius(
        point: Readonly<Vec3>,
        center: Readonly<Vec3>,
        radius: number
    ): boolean {
        return Vec3.distance(point, center) <= radius;
    }

    public static normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    public static getAngleFromDirection(direction: Readonly<Vec3>): number {
        return Math.atan2(direction.y, direction.x);
    }

    public static getDirectionFromAngle(angle: number): Vec3 {
        return new Vec3(Math.cos(angle), Math.sin(angle), 0);
    }

    public static applyDeadZone(magnitude: number, deadZone: number): number {
        if (magnitude <= deadZone) {
            return 0;
        }
        return (magnitude - deadZone) / (1 - deadZone);
    }

    public static smoothLerp(
        current: number,
        target: number,
        speed: number,
        deltaTime: number
    ): number {
        return current + (target - current) * Math.min(1, speed * deltaTime);
    }
}
