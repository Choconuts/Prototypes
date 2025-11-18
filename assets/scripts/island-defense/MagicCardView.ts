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

    @property
    info: Info

    protected onLoad(): void {
        GameManager.instance.gameReady.then(() => {
            const card = this.getComponent(CardView);
            this.info = Library.instance.get(this.database);
            this.cardID = this.randomID();
            card.apply(this.info.get('card-pool').get(this.cardID).get('block'));
        });
    }

    randomID() {
        const typeNum = this.info.get('card-pool').data.length;
        return randomRangeInt(0, typeNum).toString();
    }
}


