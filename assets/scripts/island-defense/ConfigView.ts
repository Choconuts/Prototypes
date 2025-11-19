import { _decorator, Color, Component, Graphics, Label, Node, Rect } from 'cc';
import { Info, setRectColor, Stream } from '../toolkits/Functions';
import { PatternView } from './PatternView';
const { ccclass, property } = _decorator;

@ccclass('ConfigView')
export class ConfigView extends Component {
    @property(Label)
    nameView: Label
    @property(Label)
    levelView: Label
    @property(PatternView)
    patternView: PatternView
    @property
    defaultColorHex: string = '#555769'

    level: number = 0

    eventStream: Stream<Info> = new Stream

    info: Info

    configActive(active: boolean) {
        this.nameView.node.active = active;
        this.levelView.node.active = active;
        this.patternView.node.active = active;
    }

    apply(info: Info, level: number = 1) {
        this.info = info;
        if (info != null) {
            this.configActive(true);
            this.nameView.string = info.get('card-name')?.data;
            this.levelView.string = level.toString() + '⭐';
            this.level = level;
            this.patternView.apply(info);
            setRectColor(this, info.get('card-color')?.data)
        }
        else {
            setRectColor(this, this.defaultColorHex)
            this.configActive(false);
        }

        this.eventStream.put(info);
    }
}


