import { _decorator, Component, Label, Node, randomRangeInt } from 'cc';
import { GameManager } from '../../proxy-manager/GameManager';
import { Library } from '../../proxy-manager/Library';
import { Completer, Info } from '../../toolkits/Functions';
import { HandView } from '../../common-view/HandView';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
import { SlotView } from '../../common-view/SlotView';
import { Click } from './Click';
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

    @property
    chosenBlock: string = null

    @property
    spirit = 20

    @property(Label)
    spiritLabel: Label

    lock: Completer<void> = new Completer

    protected onLoad(): void {
        Deck.instance = this;
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);
            this.initDeck();
            this.refreshHand();
            this.lock.complete();
        });
    }

    initDeck() {
        const cardInfoLList = this.baseInfo.get('level-config')?.get('deck')?.get('cards');

        for (let i = 0; i < cardInfoLList.arrayLength; i++) {
            const cardInfo = cardInfoLList.get(i.toString());
            this.deckInfos.push(cardInfo);
        }
    }

    async chooseCards(slots: Array<SlotView>, forTerrain: boolean = true, targetNum: number = -1, noAnimation: boolean = false): Promise<Array<SlotView>> {
        await this.lock.promise;
        this.lock = new Completer;
        for (const slot of slots) {
            if (!this.chosenCardMap.has(slot)) {
                this.chosenCardMap.set(slot, false);
            }
            this.chosenCardMap.set(slot, !this.chosenCardMap.get(slot));
        }

        const chosenSlots: Array<SlotView> = this.getChosenSlots();

        if (chosenSlots.length > 0) {
            this.chosenBlock = chosenSlots[0].getComponentInChildren(MagicCardView).blockType();
            let len = 0;
            for (const slot of chosenSlots) {
                if (slot.getComponentInChildren(MagicCardView).blockType() != this.chosenBlock) {
                    this.chosenBlock = null;
                    break;
                }
                else {
                    len++;
                }
            }
            if (targetNum > 0 && len != targetNum) {
                this.chosenBlock = null;
            }
        }
        else {
            this.chosenBlock = null;
        }

        if (!noAnimation) {
            this.handView.setCastMode(chosenSlots);
        }

        if (forTerrain) {
            for (const slot of this.handView.slots) {
                slot.getComponentInChildren(MagicCardView).flip(false);
            }
        }

        this.lock.complete();
        return chosenSlots;
    }

    getChosenSlots() {
        const chosenSlots: Array<SlotView> = [];
        for (const pair of this.chosenCardMap) {
            if (pair[1]) {
                chosenSlots.push(pair[0]);
            }
        }
        return chosenSlots;
    }

    async finishChooseCards(success: boolean, noAnimation: boolean = false) {
        await this.lock.promise;
        this.lock = new Completer;
        const slots = this.getChosenSlots();
        this.chosenBlock = null;
        this.chosenCardMap.clear();
        if (!noAnimation) {
            this.handView.setCastMode(null);
        }
        if (success) {
            for (const slot of slots) {
                await this.dropCard(slot);
            }
        }

        for (const slot of this.handView.slots) {
            slot.getComponentInChildren(MagicCardView).flip(true);
        }
        this.lock.complete();
    }

    async getFirstCardsSlots(num: number): Promise<Array<SlotView>> {
        if (num <= 0) {
            return [];
        }

        await this.lock.promise;
        this.lock = new Completer;
        const array = this.handView.slots;
        for (let index = 0; index < array.length; index++) {
            const slot = array[index];
            const card = slot.getComponentInChildren(MagicCardView);
            const blocktype = card.blockType();
            let slots = [slot];
            for (let i = index + 1; i < array.length; i++) {
                if (slots.length >= num) break;
                if (array[i].getComponentInChildren(MagicCardView).blockType() == blocktype) {
                    slots.push(array[i]);
                }
            }

            if (slots.length >= num) {
                this.lock.complete();
                return slots;
            }
        }
        this.lock.complete();
        return [];
    }

    hasSpirit(n: number) {
        return this.spirit >= n;
    }

    gainSpirit(n: number) {
        this.spirit += n;
        this.spiritLabel.string = '灵魂\n[' + this.spirit + ']'
    }

    async discard(slot: SlotView) {
        await this.lock.promise;
        this.lock = new Completer;
        await this.dropCard(slot);
        this.lock.complete();
    }

    async dropCard(slot: SlotView) {
        const info = slot.getComponentInChildren(MagicCardView).info;
        slot.getComponent(Click).destroy();
        this.handView.updateSlotIndices();
        await this.handView.removeCard(slot.coord.x, true);
        this.discardInfos.push(info);
    }

    drawCard(): Info {
        if (this.deckInfos.length == 0) {
            this.deckInfos = this.discardInfos;
            this.discardInfos = [];
            if (this.deckInfos.length == 0) return null;
        }
        const info = this.deckInfos[randomRangeInt(0, this.deckInfos.length)];
        this.deckInfos = this.deckInfos.filter((value) => value != info);
        return info;
    }

    async refreshHand() {
        const initNumCards = this.handView.numCards();

        for (let index = 0; index < this.handLimit - initNumCards; index++) {
            const cardInfo = this.drawCard();
            if (cardInfo != null) {
                const card = Factory.instance.get(this.cardKey);
                card.getComponent(MagicCardView).apply(cardInfo);
                await this.handView.insertCard(card, this.handView.numCards());
            }
        }
    }

    randomCardsFromPool(num: number): Array<MagicCardView> {
        const cards: Array<MagicCardView> = [];
        const arrayInfo = this.baseInfo.get('animal-pool');
        const arrayLength = arrayInfo.arrayLength;

        let candidates = [];
        for (let i = 0; i < arrayLength; i++) {
            candidates.push(i);
        }

        for (let i = 0; i < num; i++) {
            const k = randomRangeInt(0, candidates.length);
            const card = Factory.instance.get(this.cardKey)?.getComponent(MagicCardView);
            const info = arrayInfo.get(candidates[k].toString());
            card.apply(info);
            cards.push(card)
            candidates = candidates.filter((val, idx) => idx != k);
        }

        return cards;
    }

    getHandSlots() {
        return this.handView.slots.sort((a, b) => a.node.worldPosition.x - b.node.worldPosition.x);
    }
}


