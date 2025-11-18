import { _decorator, Component, Node, random, randomRangeInt } from 'cc';
import { CardView } from '../common-view/CardView';
import { Info } from '../toolkits/Functions';
import { Library } from '../proxy-manager/Library';
import { GameManager } from '../proxy-manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('MagicCardView')
export class MagicCardView extends Component {
    @property
    database: string = 'magic-card-data'
    @property
    cardID: string = '0'

    baseInfo: Info
    info: Info

    protected onLoad(): void {
        GameManager.instance.gameReady.then(() => {
            const card = this.getComponent(CardView);
            this.baseInfo = Library.instance.get(this.database);
            this.cardID = this.randomID();
            this.info = this.baseInfo.get('card-pool').get(this.cardID).get('block');
            card.apply(this.info);
        });
    }

    randomID() {
        const typeNum = this.baseInfo.get('card-pool').data.length;
        return randomRangeInt(0, typeNum).toString();
    }
}


