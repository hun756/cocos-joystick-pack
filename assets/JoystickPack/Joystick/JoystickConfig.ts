import { IJoystickConfig } from './IJoystick';

export class JoystickConfig implements IJoystickConfig {
    private static readonly DEFAULT_CONFIG: Required<IJoystickConfig> = {
        radius: 50,
        isDynamic: true,
        threshold: 25,
        deadZone: 0.1,
    };

    private readonly _config: Required<IJoystickConfig>;

    constructor(config: Partial<IJoystickConfig> = {}) {
        this._config = { ...JoystickConfig.DEFAULT_CONFIG, ...config };
        this.validateConfig();
    }

    get radius(): number {
        return this._config.radius;
    }

    get isDynamic(): boolean {
        return this._config.isDynamic;
    }

    get threshold(): number {
        return this._config.threshold;
    }

    get deadZone(): number {
        return this._config.deadZone;
    }

    public update(config: Partial<IJoystickConfig>): JoystickConfig {
        return new JoystickConfig({ ...this._config, ...config });
    }

    public toJSON(): Required<IJoystickConfig> {
        return { ...this._config };
    }

    private validateConfig(): void {
        const { radius, threshold, deadZone } = this._config;

        if (radius <= 0) {
            throw new RangeError('Joystick radius must be positive');
        }

        if (threshold < 0) {
            throw new RangeError('Joystick threshold cannot be negative');
        }

        if (deadZone < 0 || deadZone >= 1) {
            throw new RangeError('Dead zone must be between 0 and 1');
        }
    }

    public static create(config?: Partial<IJoystickConfig>): JoystickConfig {
        return new JoystickConfig(config);
    }

    public static getDefault(): Required<IJoystickConfig> {
        return { ...this.DEFAULT_CONFIG };
    }
}
