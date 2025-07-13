import {
    _decorator,
    Node,
    EventTouch,
    Vec3,
    UITransform,
    Component,
    Canvas,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CanvasResolver')
export class CanvasResolver extends Component {
    @property(Canvas)
    private readonly canvas: Canvas | null = null;

    private _canvasTransform: UITransform | null = null;
    private readonly _position: Vec3 = new Vec3();
    private _halfCanvasWidth: number = 0;
    private _halfCanvasHeight: number = 0;
    private _isInitialized: boolean = false;

    protected onLoad(): void {
        this.initializeCanvas();
    }

    protected onDestroy(): void {
        this.cleanup();
    }

    public resolvePosition(event: EventTouch): Vec3 {
        if (!this.ensureInitialized()) {
            throw new Error('CanvasResolver not properly initialized');
        }

        const location = event.touch?.getUILocation();
        if (!location) {
            throw new Error('Invalid touch event: missing location data');
        }

        const x = location.x - this._halfCanvasWidth;
        const y = location.y - this._halfCanvasHeight;
        this._position.set(x, y, 0);
        return this._position.clone();
    }

    public getCanvasSize(): { width: number; height: number } {
        if (!this._canvasTransform) {
            return { width: 0, height: 0 };
        }
        return {
            width: this._canvasTransform.width,
            height: this._canvasTransform.height,
        };
    }

    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    private initializeCanvas(): void {
        try {
            const targetCanvas = this.canvas || this.findCanvasComponent();
            if (!targetCanvas) {
                console.warn(
                    'CanvasResolver: No canvas found. Position resolution may be inaccurate.'
                );
                return;
            }

            this._canvasTransform = targetCanvas.getComponent(UITransform);
            if (!this._canvasTransform) {
                console.warn(
                    'CanvasResolver: Canvas missing UITransform component'
                );
                return;
            }

            this.updateCanvasSize();
            this.registerSizeChangeListener(targetCanvas);
            this._isInitialized = true;
        } catch (error) {
            console.error('CanvasResolver initialization failed:', error);
        }
    }

    private findCanvasComponent(): Canvas | null {
        let currentNode: Node | null = this.node;
        while (currentNode) {
            const canvas = currentNode.getComponent(Canvas);
            if (canvas) {
                return canvas;
            }
            currentNode = currentNode.parent;
        }
        return null;
    }

    private updateCanvasSize(): void {
        if (!this._canvasTransform) {
            return;
        }

        this._halfCanvasWidth = this._canvasTransform.width * 0.5;
        this._halfCanvasHeight = this._canvasTransform.height * 0.5;
    }

    private registerSizeChangeListener(canvas: Canvas): void {
        canvas.node.on(
            Node.EventType.SIZE_CHANGED,
            this.updateCanvasSize,
            this
        );
    }

    private ensureInitialized(): boolean {
        if (!this._isInitialized) {
            this.initializeCanvas();
        }
        return this._isInitialized;
    }

    private cleanup(): void {
        if (this.canvas?.node) {
            this.canvas.node.off(
                Node.EventType.SIZE_CHANGED,
                this.updateCanvasSize,
                this
            );
        }
        this._isInitialized = false;
    }
}
