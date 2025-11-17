import { _decorator, Color, Component, Graphics, Label, Node, Sprite, Vec2, Widget } from 'cc';
import { Hover } from '../common-modal/Hover';
import { RectView } from '../toolkits/RectView';
import { getOrAddComponent } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('DebugView')
export class DebugView extends Component {
    @property
    debug: boolean = false

    @property([Color])
    colors: Array<Color> = []

    widgets: Array<Widget>

    protected start(): void {
        if (!this.debug || this.colors.length == 0) {
            return;
        }
        
        this.widgets = this.node.getComponentsInChildren(Widget);
        let index = 0;
        for (const widget of this.widgets) {
            if (widget.node !== this.node) {
                this.addVisual(index, widget);
                index++;
            }
        }
    }

    addVisual(index: number, widget: Widget) {
        if (widget.node.getComponent(Sprite) != null) return;
        if (widget.node.getComponent(Label) != null) return;
        const rect = widget.node.addComponent(RectView);
        rect.radius = 0;
        const graphics = getOrAddComponent(widget.node, Graphics);
        graphics.fillColor = this.colors[index % this.colors.length];
        const hover = widget.node.addComponent(Hover);
    }
}


