import { _decorator, Color, Component, Graphics, Label, Node, Rect, v2 } from 'cc';
import { RectView } from '../../toolkits/RectView';
import { Proxy } from '../../proxy-manager/Proxy';
import { Hover } from '../../common-modal/Hover';
import { createRectWidget, createWidgetChild } from '../../toolkits/Functions';
import { DeepSea } from './DeepSea';
import { GameMap } from '../GameMap';
import { SlotView } from '../../common-view/SlotView';
import { InteractionManager, InteractionMode } from './InteractionManager';
const { ccclass, property } = _decorator;

@ccclass('HoverBlock')
export class HoverBlock extends Component {
    static declare focus: HoverBlock

    @property(RectView)
    border: RectView

    @property(Label)
    label: Label

    protected onEnable(): void {
        if (InteractionManager.instance.mode == InteractionMode.IDLE) {
            this.startHover();
        }
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelHover());
    }

    protected onDisable(): void {
        this.border?.node.destroy();
    }

    protected update(dt: number): void {
        const slot = this.getHover().getComponent(SlotView);
        if (this.border != null && GameMap.instance.isBlock(slot)) {
            this.border.node.active = false;
        }
        else {
            InteractionManager.instance.canCreateBlock(slot).then((can) => {
                if (can) {
                    this.setLabelColor(Color.WHITE);
                }
                else {
                    this.setLabelColor(Color.RED);
                }
            });
        }
    }

    public startHover() {
        HoverBlock.focus = this;
        this.createBorder();
    }

    public cancelHover() {
        this.getHover().hoverEnd();
        if (HoverBlock.focus == this) {
            HoverBlock.focus = null;
        }
    }

    canCreateBlock(slot: SlotView) {
        return slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot)
    }

    setLabelColor(color: Color) {
        if (this.label != null) {
            this.label.color = color;
        }
    }

    createBorder() {
        const root = this.getHover();
        const rect = createRectWidget(root, '#FFFFFF', 'border', 3, 5);
        rect.border = true;
        const graphics = rect.getComponent(Graphics);
        graphics.fillColor = Color.TRANSPARENT;
        graphics.strokeColor = Color.WHITE;
        graphics.lineWidth = 6;
        this.border = rect;

        const widget = createWidgetChild(this.border, 'label', { centerOffset: v2(0, 0) });

        if (this.canCreateBlock(root.getComponent(SlotView))) {
            const label = widget.addComponent(Label);
            const deepSea = root.getComponentInChildren(DeepSea);
            const cost = deepSea.depth + 1;
            label.string = '[-' + cost + ']\n创造';
            label.fontSize = 24;
            this.label = label;
        }
    }

    getHover() {
        return this.getComponent(Proxy).target.getComponent(Hover);
    }
}


