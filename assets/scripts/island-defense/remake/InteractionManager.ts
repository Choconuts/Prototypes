import { _decorator, assert, Component, Enum, Node } from 'cc';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
import { Deck } from './Deck';
import { Factory } from '../../proxy-manager/Factory';
const { ccclass, property } = _decorator;


export enum InteractionMode {
    IDLE = 'interaction-idle',
    PLACE_BLOCK = 'interaction-place-block',
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

    protected onLoad(): void {
        InteractionManager.instance = this;
    }

    canCreateBlock(slot: SlotView): boolean {
        if (InteractionManager.instance.mode != InteractionMode.IDLE) {
            return false;
        }
        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        if (!canPlaceBlock) {
            return false;
        }
        const deepSea = slot.getComponentInChildren(DeepSea);
        const num = deepSea.depth + 1;
        const slots = Deck.instance.getFirstCardsSlots(num);
        return slots.length > 0;
    }

    startGenerateBlock(slot: SlotView): boolean {
        assert(InteractionManager.instance.mode == InteractionMode.IDLE);

        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        const deepSea = slot.getComponentInChildren(DeepSea);
        const num = deepSea.depth + 1;
        const slots = Deck.instance.getFirstCardsSlots(num);

        if (canPlaceBlock && slots.length > 0) {
            InteractionManager.instance.mode = InteractionMode.PLACE_BLOCK;
            InteractionManager.instance.generateBlock = slot;
            Deck.instance.chooseCards(slots);
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

    endGenerateBlock(commit: boolean) {
        this.preview?.node.destroy();
        this.preview = null;
        const success = commit && Deck.instance.chosenBlock != null;
        if (success) {
            GameMap.instance.generateBlock(this.generateBlock.coord, Deck.instance.chosenBlock);
        }
        Deck.instance.finishChooseCards(success);
        InteractionManager.instance.mode = InteractionMode.IDLE;
        InteractionManager.instance.generateBlock = null;
    }
}


