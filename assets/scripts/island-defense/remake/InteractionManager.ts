import { _decorator, assert, Component, Enum, Node, randomRangeInt, tween } from 'cc';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
import { Deck } from './Deck';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
import { Completer, Info } from '../../toolkits/Functions';
import { Unit } from '../Unit';
import { UnitView } from '../UnitView';
import { CoolDown } from './CoolDown';
const { ccclass, property } = _decorator;


export enum InteractionMode {
    IDLE = 'interaction-idle',
    PLACE_BLOCK = 'interaction-place-block',
    PLAY_CARD = 'interaction-play-card',
    AUTO_PLAY_CARD = 'interaction-auto_play-card',
    BUY_CARD = 'interaction-buy-card',
}

@ccclass('InteractionManager')
export class InteractionManager extends Component {
    static declare instance: InteractionManager

    @property({ type: Enum(InteractionMode) })
    mode: InteractionMode = InteractionMode.IDLE
    @property
    generateBlock: SlotView = null

    @property
    previewKey: string = 'block-preview-remake'
    @property(BlockView)
    preview: BlockView

    @property
    completer: Completer<SlotView> = new Completer

    @property
    visuals: Array<Node> = []

    @property(CoolDown)
    coolDown: CoolDown = null

    protected onLoad(): void {
        InteractionManager.instance = this;
    }

    async canCreateBlock(slot: SlotView): Promise<boolean> {
        if (InteractionManager.instance.mode != InteractionMode.IDLE) {
            return false;
        }
        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        const adjacentToBlock = GameMap.instance.neighborBlocks(slot.node.worldPosition).length > 0;
        if (!canPlaceBlock || !adjacentToBlock) {
            return false;
        }
        const deepSea = slot.getComponentInChildren(DeepSea);
        const num = deepSea.depth + 1;
        const slots = await Deck.instance.getFirstCardsSlots(num);
        return slots.length > 0;
    }

    async startGenerateBlock(slot: SlotView): Promise<boolean> {
        assert(InteractionManager.instance.mode == InteractionMode.IDLE);

        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        const deepSea = slot.getComponentInChildren(DeepSea);
        const num = deepSea.depth + 1;
        const slots = await Deck.instance.getFirstCardsSlots(num);

        const adjacentToBlock = GameMap.instance.neighborBlocks(slot.node.worldPosition).length > 0;

        if (canPlaceBlock && slots.length > 0 && adjacentToBlock) {
            this.mode = InteractionMode.PLACE_BLOCK;
            this.generateBlock = slot;
            await Deck.instance.chooseCards(slots);
        }
        else {
            return false;
        }

        if (this.previewKey.length > 0) {
            const preview = Factory.instance.get(this.previewKey);
            slot.node.addChild(preview);
            this.preview?.node.destroy();
            this.preview = preview.getComponent(BlockView);
            this.preview.changeBlock(Deck.instance.chosenBlock);
        }

        return true;
    }

    updateGenerateBlock() {
        this.preview?.changeBlock(Deck.instance.chosenBlock);
    }

    async endGenerateBlock(commit: boolean) {
        this.preview?.node.destroy();
        this.preview = null;
        const success = commit && Deck.instance.chosenBlock != null;
        if (success) {
            GameMap.instance.generateBlock(this.generateBlock.coord, Deck.instance.chosenBlock);
        }
        await Deck.instance.finishChooseCards(success);
        this.mode = InteractionMode.IDLE;
        this.generateBlock = null;
    }

    async startPlayCard(slot: SlotView, autoCast: boolean = false) {
        const card = slot.getComponentInChildren(MagicCardView);
        if (!card.needTarget()) {
            if (card.gainSpirit() != null) {
                Deck.instance.gainSpirit(card.gainSpirit());
                await Deck.instance.discard(slot);
            }

        }
        else {
            if (this.mode == InteractionMode.IDLE) {
                this.mode = InteractionMode.PLAY_CARD;
            }
            this.completer = new Completer;
            await Deck.instance.chooseCards([slot], false, -1, autoCast);
            this.generateBlock = slot;
            const selectables = await this.setSelectable(card, autoCast);

            if (autoCast) {
                slot = selectables[randomRangeInt(0, selectables.length)];
                this.endPlayCard(slot, true);
            }
        }
    }

    async setSelectable(card: MagicCardView, autoCast: boolean = false): Promise<Array<SlotView>> {
        this.visuals = [];
        const selectables = await GameMap.instance.getCanGenerateCreatureSlots(card.cardInfo(), card.getType() == 'animal', card.getType() == 'building');
        if (!autoCast) {
            for (const slot of selectables) {
                this.visuals.push(slot.selectionMaskView);
                slot.selectionMaskView.active = true;
            }
        }
        return selectables;
    }

    clearVisuals() {
        for (const visual of this.visuals) {
            visual.active = false;
        }
        this.visuals = [];
    }

    stopCast() {
        this.clearVisuals();
        if (this.mode == InteractionMode.PLAY_CARD) {
            this.mode = InteractionMode.IDLE;
        }
        this.generateBlock = null;
    }

    async endPlayCard(slot: SlotView, noAnimation: boolean = false) {
        const card = this.generateBlock.getComponentInChildren(MagicCardView);
        if (card.getType() == 'animal') {
            let unit: UnitView = null;
            if (slot != null) {
                unit = GameMap.instance.generateUnit(slot.coord, card.getKey(), card.getType() == 'animal', card.getType() == 'building');
                unit.getComponent(Unit)?.apply(card.cardInfo());
                GameMap.instance.recalculatePurifyValue();
            }

            Deck.instance.finishChooseCards(unit != null, noAnimation);
            this.stopCast();
        }
        else if (card.getType() == 'magic') {
            console.log('cast', card.cardName());
            if (this.mode == InteractionMode.PLAY_CARD) {
                this.mode = InteractionMode.IDLE;
            }
            Deck.instance.finishChooseCards(false, noAnimation);
            this.stopCast();
        }
        else {
            Deck.instance.finishChooseCards(false, noAnimation);
            this.stopCast();
        }
    }

    async buyCard(): Promise<boolean> {
        if (this.mode == InteractionMode.PLACE_BLOCK) {
            await this.endGenerateBlock(false);
        }

        if (this.mode == InteractionMode.IDLE) {
            this.mode = InteractionMode.BUY_CARD;
            this.completer = new Completer;
            return true;
        }
        else if (this.mode == InteractionMode.BUY_CARD) {
            this.mode = InteractionMode.IDLE;
            return false;
        }
        else {
            return false;
        }
    }

    async exitBuyCard() {
        if (this.mode == InteractionMode.BUY_CARD) {
            this.mode = InteractionMode.IDLE;
            this.completer.complete(null);
        }
    }

    async chooseCard(slot: SlotView): Promise<boolean> {
        if (this.mode == InteractionMode.BUY_CARD) {
            const card = slot.getComponentInChildren(MagicCardView);
            const cost = card.getCost();
            if (!Deck.instance.hasSpirit(cost)) {
                return;
            }
            Deck.instance.deckInfos.push(card.info);
            Deck.instance.gainSpirit(-cost);
            this.mode = InteractionMode.IDLE;
            this.completer.complete(slot);
            return true;
        }
    }

    async nextTurn() {
        if (this.mode == InteractionMode.IDLE) {
            await Deck.instance.refreshHand();
            this.coolDown.reset();
        }
    }

    async nextTurnAuto() {
        const coolDown = this.coolDown?.cooldown();
        if (this.mode == InteractionMode.IDLE) {
            this.mode = InteractionMode.AUTO_PLAY_CARD;
            for (const slot of Deck.instance.getHandSlots()) {
                await this.startPlayCard(slot, true);
            }

            const completer = new Completer<void>;
            setTimeout(() => {
                completer.complete();
            }, 300);

            await completer.promise;

            if (coolDown) {
                await Deck.instance.refreshHand();
                this.coolDown.reset();
            }

            this.mode = InteractionMode.IDLE;
        }
    }
}


