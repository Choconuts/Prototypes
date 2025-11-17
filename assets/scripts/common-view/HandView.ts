import { _decorator, Component, Layout, Node, Size, tween, UITransform, v2, v3, Vec2, Widget } from 'cc';
import { SlotView } from './SlotView';
import { Completer, getOrAddComponent } from '../toolkits/Functions';
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

    @property([SlotView])
    slots: Array<SlotView> = []
    @property(SlotView)
    focus?: SlotView = null

    protected onLoad(): void {
        this.createLayout();
    }

    createLayout() {
        const transform = this.getComponent(UITransform);
        transform.setContentSize(this.cardSize);
        
        const layout = getOrAddComponent(this, Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = -this.foldSize;
        layout.affectedByScale = true;

        for (let i = 0; i < this.maxCardNum; i++) {
            const slot = this.createSlot(i);
            this.dectiveSlot(slot);
            this.node.addChild(slot.node);
        }
    }

    createSlot(i: number): SlotView {
        const node = new Node;
        node.name = 'slot' + '-' + i;
        const slot = node.addComponent(SlotView);
        const widget = node.addComponent(Widget);
        slot.coord = v2(i, 0);
        widget.isAlignBottom = true;
        widget.bottom = 0;
        const transform = slot.getComponent(UITransform);
        transform.setContentSize(this.cardSize);
        transform.setAnchorPoint(v2(0, 0));
        this.slots.push(slot);
        return slot;
    }

    firstEmptySlot(): SlotView {
        for (const slot of this.slots) {
            if (!slot.node.active) {
                return slot;
            }
        }
        return null;
    }

    getValidSlots(): Array<SlotView> {
        return this.slots.filter((slot, index, array) => slot.node.active);
    }

    public insertCard(card: Node, index?: number): boolean {
        console.log('insert', index, 'start');
        const slotView = this.firstEmptySlot();
        if (slotView == null) {
            return false;
        }

        if (index != null && index < this.maxCardNum) {
            slotView.node.setSiblingIndex(index);
            this.getComponent(Layout).updateLayout();
        }

        slotView.node.addChild(card);

        const cardTransform = card.getComponent(UITransform);

        const scaleX = this.cardSize.x / cardTransform.contentSize.x;
        const scaleY = this.cardSize.y / cardTransform.contentSize.y;
        const scaleMin = Math.min(scaleX, scaleY);

        cardTransform.setAnchorPoint(0, 0);
        card.scale = v3(scaleMin, scaleMin, 1);
        card.position = v3(0, 0, 0);

        console.log('insert', index, 'active');
        this.activeSlot(slotView);
        return true;
    }

    public removeCard(index: number): boolean {
        const validSlots = this.getValidSlots();
        if (index < 0 || index >= validSlots.length) {
            return false;
        }

    }

    activeSlot(slotView: SlotView) {
        if (this.animaitonDuration > 0) {
            const promise = this.slotAnimation(this.animaitonDuration, slotView, 0, 0, true, this.animaitonDelay);
            promise.then(() => {
                slotView.node.active = true;
            });
        }
        else {
            slotView.node.active = true;
        }
    }

    dectiveSlot(slotView: SlotView) {
        if (this.animaitonDuration > 0) {
            const promise = this.slotAnimation(this.animaitonDuration, slotView, 0, 0, false, this.animaitonDelay);
            promise.then(() => {
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
         {
            const cardNode = slotView.node.children[0];
            cardNode.position = v3(0, this.focusLift, 0);
        }
        }
    }

    unfocusSlot(slotView: SlotView) {
        if (this.animaitonDuration > 0) {
            this.slotAnimation(this.animaitonDuration, slotView, this.cardSize.x + this.foldSize, 0, true, this.animaitonDelay);
        }
        else if (slotView.node.children.length > 0) {
            const cardNode = slotView.node.children[0];
            cardNode.position = v3(0, 0, 0);
        }
    }

    slotAnimation(duration: number, slotView: SlotView, expand: number, lift: number = 0, reversed: boolean = false, delay: number = 0): Promise<void> {
        let cardNode = this.node;
        let newPosition = v3(0, lift, 0);
        if (slotView.node.children.length > 0) {
            cardNode = slotView.node.children[0];
            newPosition = cardNode.position;
        }

        const transform = slotView.getComponent(UITransform);
        const defaultContentX = this.cardSize.x;
        const defaultContentY = this.cardSize.y;

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


