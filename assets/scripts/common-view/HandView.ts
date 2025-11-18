import { _decorator, Component, Layout, Node, Size, tween, UITransform, v2, v3, Vec2, Widget } from 'cc';
import { SlotView } from './SlotView';
import { Completer, getOrAddComponent } from '../toolkits/Functions';
import { Hover } from '../common-modal/Hover';
import { Drag } from '../common-modal/Drag';
const { ccclass, property } = _decorator;

@ccclass('HandView')
export class HandView extends Component {
    @property
    maxCardNum: number = 10
    @property
    cardSize: Size = new Size(100, 150)
    @property
    foldSize: number = 20
    @property
    focusLift: number = 30
    @property
    animaitonDuration: number = 0.1
    @property
    animaitonDelay: number = 0.02

    @property
    hoverBehavior: string = 'default-hover-card'
    @property
    dragBehaviour: string = 'default-drag-card'

    @property
    liftBySlot: boolean = true

    @property([SlotView])
    slots: Array<SlotView> = []
    @property(SlotView)
    focus?: SlotView = null

    lock?: Completer<void> = null

    protected onLoad(): void {
        this.createLayout();
    }

    makeAlign(target: Component | Node, ): Widget {
        const widget = getOrAddComponent(target, Widget);
        widget.isAlignTop = false;
        widget.isAlignBottom = false;
        widget.isAlignLeft = false;
        widget.isAlignRight = false;
        widget.isAlignHorizontalCenter = false;
        widget.isAlignVerticalCenter = false;
        widget.alignMode = Widget.AlignMode.ALWAYS;
        return widget;
    }

    createLayout() {
        const transform = this.getComponent(UITransform);
        transform.setContentSize(this.cardSize);
        transform.setAnchorPoint(0, 0);
        
        const layout = getOrAddComponent(this, Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = -this.foldSize;
        layout.affectedByScale = true;

        const widget = this.makeAlign(this);
        widget.isAlignBottom = true;
        widget.bottom = 0;
    }

    createSlot(i: number): SlotView {
        const node = new Node;
        node.name = 'slot' + '-' + i;
        const slot = node.addComponent(SlotView);
        const widget = this.makeAlign(node);
        widget.isAlignBottom = true;
        widget.bottom = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;

        slot.coord = v2(i, 0);
        const transform = slot.getComponent(UITransform);
        transform.setContentSize(new Size(0, this.cardSize.y));
        transform.setAnchorPoint(v2(0, 0));
        slot.node.active = false;
        this.slots.push(slot);
        this.node.addChild(slot.node);
        slot.node.setSiblingIndex(i);

        if (this.hoverBehavior.length > 0) {
            const hover = slot.addComponent(Hover);
            hover.proxyKey =  this.hoverBehavior;
        }

        if (this.dragBehaviour.length > 0) {
            const drag = slot.addComponent(Drag);
            drag.proxyKey = this.dragBehaviour;
        }
        return slot;
    }

    getCardPosition(lift: number = 0) {
        if (this.liftBySlot) {
            return v3(0.5 * this.cardSize.x, 0.5 * this.cardSize.y, 0);
        }
        return v3(0.5 * this.cardSize.x, 0.5 * this.cardSize.y + lift, 0);
    }

    updateLayout() {
        this.updateSlotIndices();
        const newX = -(this.cardSize.x - this.foldSize) * this.slots.length / 2;
        tween(this.node).to(this.animaitonDuration, {position: v3(newX, 0, 0)}).start();
        this.getComponent(Layout).updateLayout(true);
    }

    public async insertCard(card: Node, index?: number): Promise<boolean> {
        await this.lock?.promise;
        this.lock = new Completer<void>;

        if (this.slots.length >= this.maxCardNum) {
            this.lock.complete();
            return false;
        }

        if (index == null || index < 0 || index >= this.maxCardNum) {
            index = this.slots.length;
        }

        const slot = this.createSlot(index);
        slot.node.addChild(card);

        const cardTransform = card.getComponent(UITransform);
        const scaleX = this.cardSize.x / cardTransform.contentSize.x;
        const scaleY = this.cardSize.y / cardTransform.contentSize.y;
        const scaleMin = Math.min(scaleX, scaleY);

        cardTransform.setAnchorPoint(0, 0.5);
        card.scale = v3(scaleMin, scaleMin, 1);
        card.position = this.getCardPosition();

        const widget = this.makeAlign(card);
        widget.isAlignLeft = true;
        widget.left = 0;
        widget.alignMode = Widget.AlignMode.ALWAYS;

        this.activeSlot(slot);
        this.updateLayout();
        this.lock.complete();
        return true;
    }

    public async removeCard(index: number): Promise<boolean> {
        await this.lock?.promise;
        this.lock = new Completer<void>;

        if (index < 0 || index >= this.slots.length) {
            this.lock.complete();
            return false;
        }

        const slot = this.slots[index];
        this.slots = this.slots.filter((slot, i, arr) => i != index);

        this.dectiveSlot(slot).then(() => {
            slot.node.destroy();
        });
        this.updateLayout();
        this.lock.complete();
        return true;
    }

    updateSlotIndices() {
        this.slots.forEach((slot, index, array) => {
            slot.coord.x = index;
        });
    }

    async activeSlot(slotView: SlotView): Promise<void> {
        slotView.node.active = true;
        if (this.animaitonDuration > 0) {
            return this.slotAnimation(this.animaitonDuration, slotView, 0, 0, true, this.animaitonDelay);
        }
        else {
            slotView.node.active = true;
        }
    }

    async dectiveSlot(slotView: SlotView): Promise<void> {
        if (this.animaitonDuration > 0) {
            const promise = this.slotAnimation(this.animaitonDuration, slotView, 0, 0, false, this.animaitonDelay);
            return promise.then(() => {
                slotView.node.active = false;
            });
        }
        else {
            slotView.node.active = false;
        }
    }

    focusSlot(slotView: SlotView) {
        if (this.focus != null) {
            this.unfocusSlot(this.focus);
        }

        if (this.animaitonDuration > 0) {
            this.slotAnimation(this.animaitonDuration, slotView, this.cardSize.x + this.foldSize, this.focusLift, false, this.animaitonDelay);
        }
        else if (slotView.node.children.length > 0) {
            const cardNode = slotView.node.children[0];
            cardNode.position = this.getCardPosition(this.focusLift);
        }
    }

    unfocusSlot(slotView: SlotView) {
        if (this.focus == slotView) {
            this.focus = null;
        }
        if (this.animaitonDuration > 0) {
            this.slotAnimation(this.animaitonDuration, slotView, this.cardSize.x + this.foldSize, this.liftBySlot ? this.focusLift : 0, true, this.animaitonDelay);
        }
        else if (slotView.node.children.length > 0) {
            const cardNode = slotView.node.children[0];
            cardNode.position = this.getCardPosition();
        }
    }

    slotAnimation(duration: number, slotView: SlotView, expand: number, lift: number = 0, reversed: boolean = false, delay: number = 0): Promise<void> {
        let cardNode = this.node;
        let newPosition = cardNode.position;
        if (slotView.node.children.length > 0) {
            cardNode = slotView.node.children[0];
            newPosition = this.getCardPosition(lift);
        }

        const transform = slotView.getComponent(UITransform);
        const widget = slotView.getComponent(Widget);
        const defaultContentX = this.cardSize.x;
        const defaultContentY = this.cardSize.y;
        const liftBySlot = this.liftBySlot;
        const completer = new Completer<void>;

        tween(cardNode)
            .delay(delay)
            .to(duration, 
                {position:newPosition}, 
                {
                    onUpdate(target, ratio) {
                        if (reversed) {
                            transform.setContentSize(expand + (defaultContentX - expand) * ratio / 1.0, defaultContentY);
                        }
                        else {
                            transform.setContentSize(defaultContentX + (expand - defaultContentX) * ratio / 1.0, defaultContentY);
                        }

                        if (liftBySlot) {
                            if (reversed) {
                                widget.bottom = lift + (0 - lift) * ratio / 1.0;
                            }
                            else {
                                widget.bottom = 0 + (lift - 0) * ratio / 1.0;
                            }
                        }
                    }, 
                    easing: "quadOut", 
                    onComplete: (target) => {
                        completer.complete();
                    }
                }
            ).start();
        
        return completer.promise;
    }
}


