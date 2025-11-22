import { _decorator, Component, Node } from 'cc';
import { GameManager } from '../../proxy-manager/GameManager';
import { Library } from '../../proxy-manager/Library';
import { Info } from '../../toolkits/Functions';
import { HandView } from '../../common-view/HandView';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
const { ccclass, property } = _decorator;

@ccclass('Deck')
export class Deck extends Component {
    static declare instance: Deck
    @property
    database: string = 'remake-data'
    @property
    cardKey: string = 'remake-card-view'
    @property
    handLimit: number = 6

    baseInfo: Info

    @property(HandView)
    handView: HandView

    deckInfos: Array<Info> = []
    discardInfos: Array<Info> = []

    protected onLoad(): void {
        Deck.instance = this;
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);
            this.initDeck();
            this.refreshHand();
        });
    }

    initDeck() {
        const cardInfoLList = this.baseInfo.get('level-config')?.get('deck')?.get('cards');

        for (let i = 0; i < cardInfoLList.arrayLength; i++) {
            const cardInfo = cardInfoLList.get(i.toString());
            this.deckInfos.push(cardInfo);
        }
    }

    refreshHand() {
        let slot = null;
        for (let index = 0; index < this.handLimit - this.handView.numCards(); index++) {
            const card = Factory.instance.get(this.cardKey);
            slot = this.handView.insertCard(card, this.handView.numCards());
            card.getComponent(MagicCardView).apply(this.deckInfos[index]);
        }
    }
}


