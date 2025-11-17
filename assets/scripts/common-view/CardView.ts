import { _decorator, Color, Component, Graphics, Label, Node, Sprite } from 'cc';
import { RectView } from '../toolkits/RectView';
import { Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('CardView')
export class CardView extends Component {
    @property(Label)
    cardName: Label
    @property(RectView)
    cardBase: RectView
    @property(Label)
    description: Label
    @property(Sprite)
    cardImage: Sprite

    protected onLoad(): void {
        if (false) {
            this.apply(Info.Empty({
                'card-name': '狮子',
                'card-color': '#AA8833',
                'desc-row1': '攻击力很高的',
                'desc-row2': '食肉动物',
            }));
        }
    }

    apply(info: Info) {
        this.cardName.string = info.get('card-name')?.data;
        this.cardBase.getComponent(Graphics).fillColor = Color.fromHEX(new Color, info.get('card-color')?.data);
        this.description.string = info.get('desc-row1')?.data + '\n' + info.get('desc-row2')?.data;
    }
}


