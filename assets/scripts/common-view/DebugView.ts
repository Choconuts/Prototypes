import { _decorator, Color, Component, Graphics, Label, Node, Sprite, Vec2, Widget } from 'cc';
import { Hover } from '../common-modal/Hover';
import { RectView } from '../toolkits/RectView';
import { getOrAddComponent, Info } from '../toolkits/Functions';
import { Factory } from '../proxy-manager/Factory';
import { HandView } from './HandView';
import { CardView } from './CardView';
const { ccclass, property } = _decorator;

@ccclass('DebugView')
export class DebugView extends Component {
    @property
    cardPath: string = 'default-card-view'
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

    addCard() {
        const card = Factory.instance.get(this.cardPath);
        const handView = this.getComponent(HandView);
        const index = handView.slots.length;
        card.getComponent(CardView).apply(Info.Empty({
            'card-name': 'Card ' + index,
            'card-color': this.colors[index % this.colors.length].toHEX("#rrggbb"),
            'desc-row1': '这是新加入的',
            'desc-row2': '测试卡片',
        }))

        handView.insertCard(card, -1);
    }

    removeCard() {
        const handView = this.getComponent(HandView);
        handView.removeCard(0);
    }
}


