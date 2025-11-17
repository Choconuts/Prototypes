import { _decorator, Color, Component, Label, Node, UITransform, v3 } from 'cc';
import { Hover } from './Hover';
import { Proxy } from '../proxy-manager/Proxy';
import { GameManager } from '../proxy-manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('DefaultHover')
export class DefaultHover extends Component {
    @property(Label)
    label: Label

    protected onEnable(): void {
        this.startHover();
        this.getComponent(Proxy).wait(Proxy.Event.CANCEL).then((_) => this.cancelHover());
    }

    protected onDisable(): void {
        this.label.node.destroy();
    }

    public startHover() {
        this.createLabel();
    }

    public cancelHover() {
        this.getHover().hoverEnd();
    }

    createLabel() {
        const node = new Node;
        node.name = 'hover-label'
        const label = node.addComponent(Label);
        label.color = Color.BLUE;
        const target = this.getHover().node;
        label.string = target.name;
        this.label = label;
        this.label.fontSize = 20;
        const root = GameManager.instance.canvas.node;
        root.addChild(node);
        const worldPos = target.getWorldPosition();

        const rootTransform = root.getComponent(UITransform);
        node.position = rootTransform.convertToNodeSpaceAR(v3(worldPos.x, worldPos.y, 0));
    }

    getHover() {
        return this.getComponent(Proxy).target.getComponent(Hover);
    }
}


