import { _decorator, Color, Component, Label, Node } from 'cc';
import { Hover } from './Hover';
import { Proxy } from '../proxy-manager/Proxy';
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
        const label = node.addComponent(Label);
        label.color = Color.BLUE;
        const target = this.getHover().node;
        label.string = target.name;
        this.label = label;

        target.addChild(node);
        node.position = target.position;
    }

    getHover() {
        return this.getComponent(Proxy).target.getComponent(Hover);
    }
}


