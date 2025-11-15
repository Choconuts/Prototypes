import { _decorator, Color, Component, Graphics, Node, UITransform, v3, Vec3 } from 'cc';
import { GameManager } from '../proxy-manager/GameManager';
import { RectView } from '../toolkits/RectView';
import { Proxy } from '../proxy-manager/Proxy';
import { Drag } from './Drag';
import { getOrAddComponent, Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('DefaultDrag')
export class DefaultDrag extends Component {
    @property(RectView)
    icon: RectView

    protected onEnable(): void {
        this.startDrag();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelDrag());
    }

    public startDrag() {
        this.createIcon();
        this.nextUpdateEvent();
    }

    public updateDrag(info: Info) {
        const cursorRelative: Vec3 = info?.get('relative')?.data;
        if (cursorRelative != null) {
            this.icon.node.active = true;
            this.icon.node.position = cursorRelative;
        }
    }

    public cancelDrag() {
        this.getDrag().dragEnd();
    }

    nextUpdateEvent(info?: Info) {
        this.updateDrag(info);
        this.getComponent(Proxy).wait(Proxy.Event.UPDATE).then((info) => this.nextUpdateEvent(info));
    }

    protected onDisable(): void {
        this.icon.node.destroy();
    }

    createIcon() {
        if (this.icon == null) {
            const rect = new Node;
            rect.active = false;
            const roundRect = rect.addComponent(RectView);
            roundRect.radius = 40;
            roundRect.node.scale = v3(0.5, 0.5, 0.5);
            const graphics = rect.addComponent(Graphics);
            graphics.fillColor = Color.BLUE;
            const transform = getOrAddComponent(rect, UITransform);
            transform.setAnchorPoint(0.5, 0.5);
            this.icon = roundRect;
        }
        this.getDrag().node.addChild(this.icon.node);
    }

    getDrag() {
        return this.getComponent(Proxy).target.getComponent(Drag);
    }
}


