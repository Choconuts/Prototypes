import { _decorator, Component, Node, Tween, tween, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { CardView } from './CardView';
import { Proxy } from '../proxy-manager/Proxy';
import { getOrAddComponent, Info } from '../toolkits/Functions';
import { Drag } from '../common-modal/Drag';
import { GameManager } from '../proxy-manager/GameManager';
import { HandView } from './HandView';
const { ccclass, property } = _decorator;

@ccclass('DefaultDragCard')
export class DefaultDragCard extends Component {
    @property
    duration: number = 0.02
    @property
    shrinkScale: number = 0.5
    @property(CardView)
    card?: CardView
    @property
    slotNode?: Node
    @property
    hand?: HandView
    @property
    wrapNode?: Node

    protected onEnable(): void {
        this.startDrag();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelDrag());
    }

    public startDrag() {
        if (this.card == null) {
            this.wrapCardNode();
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
        this.getDrag().dragEnd();
    }

    nextUpdateEvent(info?: Info) {
        this.updateDrag(info);
        this.getComponent(Proxy).wait(Proxy.Event.UPDATE).then((info) => this.nextUpdateEvent(info));
    }

    protected onDisable(): void {
        const card = this.card;
        this.slotNode?.addChild(card.node);
        this.slotNode = null;
        this.card = null;
        this.wrapNode.destroy();
        this.wrapNode = null;

        if (this.hand != null) {
            tween(card.node).to(this.duration, {position: this.hand.getCardPosition(0)}).start();
        }
    }

    getDrag() {
        return this.getComponent(Proxy).target.getComponent(Drag);
    }

    wrapPositionByWorldPosition(worldPosition: Vec3): Vec3 {
        const transform = this.getCanvas().getComponent(UITransform);
        const relative = transform.convertToNodeSpaceAR(v3(worldPosition.x, worldPosition.y, 0));
        return relative.add(this.getOffset());
    }

    wrapCardNode(): Node {
        this.card = this.getDrag().getComponent(CardView);
        const initPosition = this.wrapPositionByWorldPosition(this.card.node.getWorldPosition()).subtract(this.getOffset());

        this.slotNode = this.card.node.parent;
        this.hand = this.card.getContainer(HandView);

        this.wrapNode = new Node;
        this.wrapNode.name = 'dragging-card';
        const transform = getOrAddComponent(this.wrapNode, UITransform);
        const cardTransform = this.card.getComponent(UITransform);
        const size = this.getCardSize();
        transform.setAnchorPoint(cardTransform.anchorPoint);
        transform.setContentSize(size.x, size.y);

        this.wrapNode.addChild(this.card.node);
        this.getCanvas().addChild(this.wrapNode);
        this.wrapNode.position = initPosition;

        this.card.node.position = v3(0, 0, 0);
        return this.wrapNode;
    }

    getCardSize(): Vec2 {
        const cardTransform = this.card.getComponent(UITransform);
        return v2(cardTransform.contentSize.x * this.card.node.scale.x, cardTransform.contentSize.y * this.card.node.scale.y);
    }

    getOffset(): Vec3 {
        const cardTransform = this.card.getComponent(UITransform);
        const anchorX = cardTransform.anchorPoint.x;
        const anchorY = cardTransform.anchorPoint.y;
        const size = this.getCardSize();
        return v3((anchorX - 0.5) * size.x, (anchorY - 0.5) * size.y, 0);
    }

    shrink() {
        tween(this.wrapNode).to(this.duration, {scale: v3(0.5)})
    }
}


