import { _decorator, clamp, Color, Component, Graphics, Node, tween } from 'cc';
import { createWidgetChild, getOrAddComponent } from '../toolkits/Functions';
import { RectView } from '../toolkits/RectView';
const { ccclass, property } = _decorator;

@ccclass('ProgressView')
export class ProgressView extends Component {
    @property
    cornerRadius: number = 20
    @property(RectView)
    progress: RectView
    @property(Color)
    background: Color = Color.WHITE
    @property(Color)
    foreground: Color = Color.GREEN
    @property
    duration: number = 0.1

    @property
    padding: number = 5

    declare maxRectLength: number

    protected onLoad(): void {
        const bar = this.createBar('bar', this.background, 0);
        this.progress = this.createBar('progress', this.foreground, this.padding);
        this.maxRectLength = this.progress.rect.xMax - this.progress.rect.xMin;
    }

    createBar(name: string, color: Color, padding: number = 0): RectView {
        const barWidget = createWidgetChild(this, name, {expandPadding: padding});
        const barRect = barWidget.addComponent(RectView);
        const barGraphics = getOrAddComponent(barWidget, Graphics);
        barGraphics.fillColor = color;

        barRect.percentageRadius = true;
        barRect.radius = this.cornerRadius;
        return barRect;
    }

    get value(): number {
        const length = this.progress.rect.xMax - this.progress.rect.xMin;
        return length / this.maxRectLength;
    }

    set value(newValue: number) {
        newValue = clamp(newValue, 0, 1);
        const rect = this.progress.rect.clone();
        rect.xMax = this.progress.rect.xMin + newValue * this.maxRectLength;
        tween(this.progress).to(this.duration, {rect: rect}, {onUpdate: () => this.progress.draw()}).start();
    }

    setColor(color: Color) {
        const graphics = this.progress.getComponent(Graphics);
        graphics.fillColor = color;
        this.progress.draw();
    }
}


