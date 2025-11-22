import { _decorator, Color, Component, Gradient, Graphics, Label, Node, Rect, v2, v3 } from 'cc';
import { GridView } from '../common-view/GridView';
import { Completer, createRectWidget, createWidgetChild, Info } from '../toolkits/Functions';
import { GameManager } from '../proxy-manager/GameManager';
import { Library } from '../proxy-manager/Library';
const { ccclass, property } = _decorator;

@ccclass('PatternView')
export class PatternView extends Component {
    @property(GridView)
    gridView: GridView

    @property
    cellSize: number = 0.95
    @property
    cellRadius: number = 20;

    completer: Completer<void> = new Completer

    protected start(): void {
        this.completer.complete();
    }

    async apply(info: Info): Promise<void> {
        const array = info.get("region-display");
        const targets = info.get("region-targets");
        const targetMap: Array<boolean> = new Array(15);

        for (let j = 0; j < targets.arrayLength; j++) {
            const target = targets.get(j.toString()).data;
            targetMap[target] = true;
        }

        for (let i = 0; i < array.arrayLength; i++) {
            const tag = array.get(i.toString());
            if (tag != null) {
                this.completer.promise.then(() => {
                    this.box(info, i, tag.data, targetMap[i] != null);
                })
            }
        }

        return this.completer.promise;
    }

    box(info: Info, index: number, tag: string, target: boolean = false) {
        const slotNode = this.gridView.slots[index];

        if (tag == 'or' || tag == ' or' || tag == '  or') {
            const widget = createWidgetChild(slotNode, 'target', { centerOffset: v2(0, 0) });
            const label = widget.addComponent(Label);
            label.string = tag;
            label.color = new Color(0, 0, 0, 255);
            label.fontSize = 24;
            label.isBold = true;
        }
        else if (tag == 'empty') {

        }
        else {
            const color = info.base.get('block-type').get(tag).get('card-color').data;
            const rect = createRectWidget(slotNode, color, tag);
            rect.node.angle = 45;
            const scale = Math.SQRT2 * this.cellSize;
            rect.rect = new Rect(-50 * scale, -50 * scale, 100 * scale, 100 * scale);
            rect.radius = this.cellRadius;
            rect.border = true;
            const graphics = rect.getComponent(Graphics);
            graphics.strokeColor = Color.fromHEX(new Color, '#FFFFFF');
            graphics.lineWidth = 4;
        }

        if (target) {
            const widget = createWidgetChild(slotNode, 'target', { centerOffset: v2(0, 0) });
            const label = widget.addComponent(Label);
            label.string = '+';
            label.fontSize = 24;
        }
    }
}


