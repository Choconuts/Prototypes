import { _decorator, assert, Component, Enum, Node, tween } from 'cc';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
import { Deck } from './Deck';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
import { Completer, Info } from '../../toolkits/Functions';
const { ccclass, property } = _decorator;


export enum InteractionMode {
    IDLE = 'interaction-idle',
    PLACE_BLOCK = 'interaction-place-block',
    PLAY_CARD = 'interaction-play-card',
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

    protected onLoad(): void {
        InteractionManager.instance = this;
    }

    async canCreateBlock(slot: SlotView): Promise<boolean> {
        if (InteractionManager.instance.mode != InteractionMode.IDLE) {
            return false;
        }
        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        if (!canPlaceBlock) {
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

        if (canPlaceBlock && slots.length > 0) {
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
            this.mode = InteractionMode.PLAY_CARD;
            this.completer = new Completer;
            await Deck.instance.chooseCards([slot], false);
            this.generateBlock = slot;
            await this.setSelectable(card);
        }
    }

    async setSelectable(card: MagicCardView) {
        this.visuals = [];
        const selectables = await GameMap.instance.getCanGenerateCreatureSlots(card.cardInfo(), card.getType() == 'animal', card.getType() == 'building');
        for (const slot of selectables) {
            this.visuals.push(slot.selectionMaskView);
            slot.selectionMaskView.active = true;
        }
    }

    async endPlayCard(commit: boolean) {
        for (const visual of this.visuals) {
            visual.active = false;
        }
        this.visuals = [];
        if (commit) {
            const card = this.generateBlock.getComponentInChildren(MagicCardView);
            const unit = GameMap.instance.generateCreature(card.cardInfo(), card.getKey(), card.getType() == 'animal', card.getType() == 'building');

            if (unit == null) {
                commit = false;
            }
        }
        Deck.instance.finishChooseCards(commit);
        this.mode = InteractionMode.IDLE;
        this.generateBlock = null;
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
        }
    }

    async nextTurnAuto() {
        if (this.mode == InteractionMode.IDLE) {
            for (const slot of Deck.instance.getHandSlots()) {
                await this.startPlayCard(slot, true);
            }

            const completer = new Completer<void>;
            setTimeout(() => {
                completer.complete();
            }, 300);

            await completer.promise;
            await Deck.instance.refreshHand();
        }
    }
}


