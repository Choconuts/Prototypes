import { _decorator, Component, Input, input, Node } from 'cc';
import { Click } from './Click';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { Proxy } from '../../proxy-manager/Proxy';
import { InteractionManager, InteractionMode } from './InteractionManager';
import { HoverBlock } from './HoverBlock';
import { Deck } from './Deck';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
const { ccclass, property } = _decorator;

@ccclass('ClickBlock')
export class ClickBlock extends Component {
    static declare clickBlock: ClickBlock

    protected onEnable(): void {
        if (InteractionManager.instance.mode == InteractionMode.IDLE) {
            ClickBlock.clickBlock?.endPlaceBlock();
            ClickBlock.clickBlock = this;
            this.startPlaceBlock();
        }
        else {
            ClickBlock.clickBlock?.endPlaceBlock();
            ClickBlock.clickBlock = null;
            this.getBlockClick()?.close();
        }
    }

    endPlaceBlock() {
        InteractionManager.instance.mode = InteractionMode.IDLE;
        Deck.instance.finishChooseCards();
        this.getBlockClick()?.close();
    }

    protected onDisable(): void {
        this.endPlaceBlock();
    }

    startPlaceBlock() {
        console.log('start');
        const slot = this.getBlockSlot();
        const canPlaceBlock = slot != null && !GameMap.instance.isBlock(slot) && !GameMap.instance.hasEnemy(slot);
        const deepSea = slot.getComponentInChildren(DeepSea);
        const num = deepSea.depth + 1;
        const slots = Deck.instance.getFirstCardsSlots(num);
        if (canPlaceBlock && slots.length > 0) {
            InteractionManager.instance.mode = InteractionMode.PLACE_BLOCK;
            Deck.instance.chooseCards(slots);
        }
    }

    getBlockClick(): Click {
        return this.getComponent(Proxy)?.target?.getComponent(Click);
    }

    getBlockSlot(): SlotView {
        return this.getComponent(Proxy)?.target?.getComponent(SlotView);
    }

    getBlock(): BlockView {
        return this.getBlockSlot().getComponentInChildren(BlockView);
    }
}


