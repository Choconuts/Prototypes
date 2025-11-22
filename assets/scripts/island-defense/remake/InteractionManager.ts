import { _decorator, assert, Component, Enum, Node } from 'cc';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
import { Deck } from './Deck';
import { Factory } from '../../proxy-manager/Factory';
import { MagicCardView } from '../MagicCardView';
import { Completer } from '../../toolkits/Functions';
const { ccclass, property } = _decorator;


export enum InteractionMode {
    IDLE = 'interaction-idle',
    PLACE_BLOCK = 'interaction-place-block',
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
            InteractionManager.instance.mode = InteractionMode.PLACE_BLOCK;
            InteractionManager.instance.generateBlock = slot;
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
        InteractionManager.instance.mode = InteractionMode.IDLE;
        InteractionManager.instance.generateBlock = null;
    }

    startPlayCard(slot: SlotView) {
        const card = slot.getComponentInChildren(MagicCardView);
        if (!card.needTarget()) {
            if (card.gainSpirit() != null) {
                Deck.instance.gainSpirit(card.gainSpirit());
                Deck.instance.discard(slot);
            }
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
}


