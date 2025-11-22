import { _decorator, Component, Node } from 'cc';
import { GameManager } from '../../proxy-manager/GameManager';
import { Library } from '../../proxy-manager/Library';
import { Info } from '../../toolkits/Functions';
import { HandView } from '../../common-view/HandView';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
import { SlotView } from '../../common-view/SlotView';
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

    chosenCardMap: Map<SlotView, boolean> = new Map;

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

    chooseCards(slots: Array<SlotView>) {
        for (const slot of slots) {
            if (!this.chosenCardMap.has(slot)) {
                this.chosenCardMap.set(slot, false);
            }
            this.chosenCardMap.set(slot, !this.chosenCardMap.get(slot));
        }

        const chosenSlots = [];
        for (const pair of this.chosenCardMap) {
            if (pair[1]) {
                chosenSlots.push(pair[0]);
            }
        }

        this.handView.setCastMode(chosenSlots);
    }

    finishChooseCards() {
        this.chosenCardMap.clear();
        this.handView.setCastMode(null);
    }

    getFirstCardsSlots(num: number): SlotView[] {
        if (num <= 0) return [];
        const array = this.handView.slots;
        for (let index = 0; index < array.length; index++) {
            const slot = array[array.length - 1 - index];
            const card = slot.getComponentInChildren(MagicCardView);
            const blocktype = card.blockType();
            let slots = [slot];
            for (let i = index + 1; i < array.length; i++) {
                if (slots.length >= num) break;
                if (array[array.length - 1 - i].getComponentInChildren(MagicCardView).blockType() == blocktype) {
                    slots.push(array[array.length - 1 - i]);
                }
            }

            if (slots.length >= num) {
                return slots;
            }
        }
        return [];
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


