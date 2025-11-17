import { _decorator, clamp, Color, Component, Graphics, Node, Rect, tween, UITransform, v3, Vec3 } from 'cc';
import { GameManager } from '../proxy-manager/GameManager';
import { RectView } from '../toolkits/RectView';
import { Proxy } from '../proxy-manager/Proxy';
import { Drag } from './Drag';
import { getOrAddComponent, Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('DefaultDrag')
export class DefaultDrag extends Component {
    @property(Vec3)
    initPosition: Vec3
    @property(Vec3)
    firstCursorPosition: Vec3
    @property
    scrolling: boolean = false
    @property
    duration: number = 0.05
    @property(Rect)
    range: Rect = new Rect(-600, -400, 1200, 800)

    protected onEnable(): void {
        this.startDrag();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelDrag());
    }

    public startDrag() {
        this.initPosition = this.getDrag().node.position.clone();
        this.nextUpdateEvent();
    }

    public updateDrag(info: Info) {
        const cursorAbsolute: Vec3 = info?.get('absolute')?.data;
        if (cursorAbsolute != null) {
            if (!this.scrolling) {
                this.firstCursorPosition = cursorAbsolute;
                this.scrolling = true;
            }
            const newPos = this.initPosition.clone().add(cursorAbsolute).subtract(this.firstCursorPosition);
            newPos.x = clamp(newPos.x, this.range.x, this.range.xMax);
            newPos.y = clamp(newPos.y, this.range.y, this.range.yMax);
            tween(this.getDrag().node).to(this.duration, {position: newPos}).start();
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

    }

    getDrag() {
        return this.getComponent(Proxy).target.getComponent(Drag);
    }
}


