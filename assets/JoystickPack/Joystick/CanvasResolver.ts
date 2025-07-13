import { _decorator, Node, EventTouch, Vec3, UITransform, Component, Canvas } from "cc";
const { ccclass, property } = _decorator;

@ccclass("CanvasResolver")
export class CanvasResolver extends Component {
    @property(Canvas)
    private readonly canvas?: Canvas;

    private canvasTransform?: UITransform;
    private readonly position: Vec3 = new Vec3();
    private halfCanvasWidth: number = 0;
    private halfCanvasHeight: number = 0;

    onLoad() {
        this.canvasTransform = this.canvas?.getComponent(UITransform);
        this.updateCanvasSize();
        this.canvas?.node.on(Node.EventType.SIZE_CHANGED, this.updateCanvasSize, this);
    }

    onDestroy() {
        this.canvas?.node.off(Node.EventType.SIZE_CHANGED, this.updateCanvasSize, this);
    }

    private updateCanvasSize() {
        this.halfCanvasWidth = this.canvasTransform?.width / 2 || 0;
        this.halfCanvasHeight = this.canvasTransform?.height / 2 || 0;
    }

    public resolvePosition(event: EventTouch): Vec3 {
        const location = event.touch.getUILocation();
        const x = location.x - this.halfCanvasWidth;
        const y = location.y - this.halfCanvasHeight;
        this.position.set(x, y, 0);
        return this.position;
    }
}
