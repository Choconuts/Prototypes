import { _decorator, Component, Node, random, randomRangeInt } from 'cc';
import { CardView } from '../common-view/CardView';
import { Info } from '../toolkits/Functions';
import { Library } from '../proxy-manager/Library';
import { GameManager } from '../proxy-manager/GameManager';
import { PatternView } from './PatternView';
import { GameMap } from './GameMap';
const { ccclass, property } = _decorator;

@ccclass('MagicCardView')
export class MagicCardView extends Component {
    @property
    database: string = 'magic-card-data'
    @property
    cardID: string = '0'
    @property(PatternView)
    pattern: PatternView

    baseInfo: Info
    info: Info

    frontFace: boolean = true

    protected onLoad(): void {
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);

            if (!GameMap.instance.remake) {
                const card = this.getComponent(CardView);
                this.cardID = this.randomID();

                if (random() > 0.3) {
                    this.info = this.baseInfo.get('card-pool').get(this.cardID).get('block');
                }
                else {
                    this.info = this.baseInfo.get('card-pool').get(this.cardID).get('magic');
                }

                card.apply(this.info);
            }

        });
    }

    apply(info: Info) {
        this.info = info;
        const cardInfo = this.cardInfo();
        this.getComponent(CardView).apply(cardInfo);

        if (this.pattern != null && this.frontFace) {
            this.pattern.apply(cardInfo);
        }
    }

    blockType() {
        return this.info?.get('block')?.get('block-type').data;
    }

    randomID() {
        const typeNum = this.baseInfo.get('card-pool').data.length;
        return randomRangeInt(0, typeNum).toString();
    }

    cardInfo() {
        return this.frontFace ? this.info?.get('magic') : this.info?.get('block');
    }

    cardName() {
        return this.cardInfo()?.get('card-name').data;
    }

    flip(frontFace: boolean) {
        this.frontFace = frontFace;
        this.apply(this.info);
    }

    needTarget() {
        const strategy = this.cardInfo()?.get('attributes')?.get('strategy');
        return strategy == null || strategy.data != 'no-target';
    }

    gainSpirit() {
        const spirit = this.cardInfo()?.get('attributes')?.get('spirit');
        return spirit?.data;
    }

    getCost() {
        const cost = this.cardInfo()?.get('attributes')?.get('cost');
        return cost?.data;
    }
}


