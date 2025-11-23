import { _decorator, Color, Component, Graphics, Label, Mask, Node, tween } from 'cc';
import { Deck } from './Deck';
import { RectView } from '../../toolkits/RectView';
import { Completer } from '../../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('ScheduleView')
export class ScheduleView extends Component {
    @property(Label)
    label: Label
    @property(Graphics)
    graphicA: Graphics
    @property(Graphics)
    graphicB: Graphics
    @property(Mask)
    mask: Mask

    @property(Graphics)
    graphicC: Graphics

    @property(Color)
    initColor: Color = new Color

    @property(Color)
    highlightColor: Color = new Color

    @property
    duration: number = 0.5

    @property
    blockTypeA: string = null
    @property
    blockTypeB: string = null

    blockTypes(): Array<string> {
        if (this.blockTypeA == null) return [];
        else if (this.blockTypeB == null) return [this.blockTypeA];
        return [this.blockTypeA, this.blockTypeB];
    }

    setName(name: string) {
        this.label.string = name;
        return this;
    }

    redraw() {
        for (const rect of this.getComponentsInChildren(RectView)) {
            rect.draw();
        }
        return this;
    }

    getColor(blockType: string) {
        const color = Deck.instance.baseInfo.get('block-type').get(blockType).get('card-color').data;
        return Color.fromHEX(new Color, color);
    }

    setBlockType(blockTypeA: string, blockTypeB?: string) {
        this.blockTypeA = blockTypeA;
        this.blockTypeB = blockTypeB;

        if (blockTypeA == null) {
            this.mask.node.active = false;
            this.graphicA.fillColor = this.getComponent(Graphics).fillColor;
            this.redraw();
            return this;
        }

        this.graphicA.fillColor = this.getColor(blockTypeA);
        if (blockTypeB != null) {
            this.graphicB.fillColor = this.getColor(blockTypeB);
            this.mask.node.active = true;
        }
        else {
            this.mask.node.active = false;
        }
        this.redraw();
        return this;
    }

    async highlight(): Promise<void> {
        const completer: Completer<void> = new Completer;

        tween(this.graphicC).to(this.duration, { fillColor: this.highlightColor }, { onUpdate: () => this.redraw(), easing: 'quadInOut' }).start();
        tween(this.graphicC).delay(this.duration).to(this.duration, { fillColor: this.initColor }, 
            { onUpdate: () => this.redraw(), easing: 'quadInOut', onComplete: () => completer.complete() }).start();
        return completer.promise;
    }
}


