import { _decorator, Component, Node, Tween, tween, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { CardView } from './CardView';
import { Proxy } from '../proxy-manager/Proxy';
import { getOrAddComponent, Info } from '../toolkits/Functions';
import { Drag } from '../common-modal/Drag';
import { GameManager } from '../proxy-manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('DefaultDragCard')
export class DefaultDragCard extends Component {
    @property
    duration: number = 0.05
    @property
    shrinkScale: number = 0.6
    @property
    shrinkDuration: number = 0.1
    @property(CardView)
    card?: CardView
    @property
    slotNode?: Node
    @property
    wrapNode?: Node
    @property
    initPosition: Vec3

    protected onEnable(): void {
        this.startDrag();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelDrag());
    }

    public startDrag() {
        if (this.card == null) {
            this.wrapCardNode();
            this.shrink();
        }
        this.nextUpdateEvent();
    }

    public updateDrag(info: Info) {
        const cursorAbsolute: Vec3 = info?.get('absolute')?.data;
        if (cursorAbsolute != null) {
            tween(this.wrapNode).to(this.duration, {position: this.wrapPositionByWorldPosition(cursorAbsolute)}).start();
        }
    }

    getCanvas() {
        return GameManager.instance.canvas.node;
    }

    public cancelDrag() {
        tween(this.wrapNode).to(this.duration, {position: this.initPosition}, {onComplete: () => {
            this.removeWrapNode();
            this.getDrag().dragEnd();
        }}).start();
    }

    nextUpdateEvent(info?: Info) {
        this?.updateDrag(info);
        this?.getComponent(Proxy).wait(Proxy.Event.UPDATE).then((info) => this?.nextUpdateEvent(info));
    }

    protected onDisable(): void {

    }

    getDrag() {
        return this.getComponent(Proxy).target.getComponent(Drag);
    }

    wrapPositionByWorldPosition(worldPosition: Vec3): Vec3 {
        const transform = this.getCanvas().getComponent(UITransform);
        const relative = transform.convertToNodeSpaceAR(v3(worldPosition.x, worldPosition.y, 0));
        const offset = this.getOffset();
        if (offset == null) return null;
        return relative.add(offset);
    }

    wrapCardNode(): Node {
        this.card = this.getDrag().getComponentInChildren(CardView);
        this.initPosition = this.wrapPositionByWorldPosition(this.card.node.getWorldPosition()).subtract(this.getOffset());

        this.slotNode = this.card.node.parent;
        this.wrapNode = new Node;
        this.wrapNode.name = 'dragging-card';
        const transform = getOrAddComponent(this.wrapNode, UITransform);
        const cardTransform = this.card.getComponent(UITransform);
        const size = this.getCardSize();
        transform.setAnchorPoint(cardTransform.anchorPoint);
        transform.setContentSize(size.x, size.y);

        this.wrapNode.addChild(this.card.node);
        this.getCanvas().addChild(this.wrapNode);
        this.wrapNode.position = this.initPosition;
        return this.wrapNode;
    }

    removeWrapNode() {
        if (this.card != null && this.wrapNode != null) {
            this.slotNode?.addChild(this.card.node);
            this.slotNode = null;
            this.card = null;
            this.wrapNode.destroy();
            this.wrapNode = null;
        }
    }

    getCardSize(): Vec2 {
        if (this.card == null) return null;
        const cardTransform = this.card.getComponent(UITransform);
        return v2(cardTransform.contentSize.x * this.card.node.scale.x, cardTransform.contentSize.y * this.card.node.scale.y);
    }

    getOffset(): Vec3 {
        if (this.card == null) return null;
        const cardTransform = this.card.getComponent(UITransform);
        const anchorX = cardTransform.anchorPoint.x;
        const anchorY = cardTransform.anchorPoint.y;
        const size = this.getCardSize();
        return v3((anchorX - 0.5) * size.x, (anchorY - 0.5) * size.y, 0).multiplyScalar(this.shrinkScale).subtract(this.card.node.position);
    }

    shrink() {
        tween(this.wrapNode).to(this.shrinkDuration, {scale: v3(this.shrinkScale, this.shrinkScale, this.shrinkScale)}).start();
    }
}


