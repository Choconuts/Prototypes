import { _decorator, Component, Node } from 'cc';
import { Proxy } from '../proxy-manager/Proxy';
import { Hover } from '../common-modal/Hover';
import { HandView } from './HandView';
import { SlotView } from './SlotView';
const { ccclass, property } = _decorator;

@ccclass('DefaultHoverCard')
export class DefaultHoverCard extends Component {

    protected onEnable(): void {
        this.startHover();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelHover());
    }

    protected onDisable(): void {
        const slot = this.getHover().getComponent(SlotView);
        const handview = slot.node.parent.getComponent(HandView);
        handview.unfocusSlot(slot);
    }

    public startHover() {
        const slot = this.getHover().getComponent(SlotView);
        const handview = slot.node.parent.getComponent(HandView);
        handview.focusSlot(slot);
    }

    public cancelHover() {
        this.getHover().hoverEnd();
    }

    getHover() {
        return this.getComponent(Proxy).target.getComponent(Hover);
    }
}


