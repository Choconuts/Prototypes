import { _decorator, Component, Node } from 'cc';
import { DefaultHover } from '../common-modal/DefaultHover';
import { Hover } from '../common-modal/Hover';
const { ccclass, property } = _decorator;

@ccclass('HoverDrop')
export class HoverDrop extends DefaultHover {
    static declare focus: HoverDrop

    public startHover() {
        HoverDrop.focus = this;
    }

    public onDisable(): void {
        
    }

    public cancelHover(): void {
        super.cancelHover();
        if (HoverDrop.focus == this) {
            HoverDrop.focus = null;
        }
    }
}


