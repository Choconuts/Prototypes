import { _decorator, Component, Graphics, Node, NodeEventType, Rect, Size, UITransform, v2 } from 'cc';
import { getOrAddComponent } from './Functions';
const { ccclass, property } = _decorator;

@ccclass('RectView')
export class RectView extends Component {
    @property({type: Rect, tooltip: 'Rectangular coodinates, the origin is center of the node.'})
    rect: Rect = new Rect(-50, -50, 100, 100)
    @property({tooltip: 'If true, the rect is percentage of node content.'})
    percentageRect: boolean = true
    @property({tooltip: 'Rounded rectangular corner radius.'})
    radius: number = 10
    @property({tooltip: 'If true, the radius is percentage of minimum side length.'})
    percentageRadius: boolean = true
    @property({tooltip: 'If true, the rectangular will be stroked.'})
    border: boolean = false
    @property
    forceUpdate: boolean = false
    @property
    anchorAsCenter: boolean = false
    @property(Graphics)
    graphics: Graphics

    onLoad() {
        if (this.graphics == null) {
            this.graphics = getOrAddComponent(this, Graphics)
        }
        this.node.on(NodeEventType.TRANSFORM_CHANGED, () => this.draw());
        this.node.on(NodeEventType.SIZE_CHANGED, () => this.draw());
    }

    start() {
        this.draw();
    }

    update(deltaTime: number) {
        if (this.forceUpdate) {
            this.draw();
        }
    }

    draw(): boolean {
        if (this.graphics == null) {
            return false;
        }

        this.graphics.clear();

        let size = this.rect.size;
        let origin = this.rect.origin;
        let radius = this.radius;
        const transform =  this.getComponent(UITransform);
        if (this.percentageRect) {
            const contentSizeX = transform.contentSize.x;
            const contentSizeY = transform.contentSize.y;
            const anchorX = transform.anchorX;
            const anchorY = transform.anchorY;
            size = new Size(contentSizeX * size.width / 100, contentSizeY * size.height / 100);

            if (!this.anchorAsCenter) {
                const originX = (origin.x / 100 - anchorX + 0.5) * contentSizeX;
                const originY = (origin.y / 100 - anchorY + 0.5) * contentSizeY;
                origin = v2(originX, originY);
            }
            else {
                origin = v2(origin.x / 100 * size.x, origin.y / 100 * size.y);
            }
        }
        else if (!this.anchorAsCenter) {
            const anchorX = transform.anchorX;
            const anchorY = transform.anchorY;
            const originX = origin.x - (anchorX - 0.5) * size.x;
            const originY = origin.y - (anchorY - 0.5) * size.y;
            origin = v2(originX, originY);
        }
        if (this.percentageRadius) {
            radius = radius * Math.min(size.x, size.y) / 100;
        }

        this.graphics.roundRect(origin.x, origin.y, size.x, size.y, radius);

        this.graphics.fill();

        if (this.border) {
            this.graphics.stroke();
        }

        return true;
    }
}


