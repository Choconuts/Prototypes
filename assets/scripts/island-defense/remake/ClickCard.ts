import { _decorator, Component, Node } from 'cc';
import { Proxy } from '../../proxy-manager/Proxy';
import { SlotView } from '../../common-view/SlotView';
import { MagicCardView } from '../MagicCardView';
import { Click } from './Click';
import { InteractionManager, InteractionMode } from './InteractionManager';
import { Deck } from './Deck';
const { ccclass, property } = _decorator;

@ccclass('ClickCard')
export class ClickCard extends Component {
    
    protected onEnable(): void {
        if (InteractionManager.instance.mode == InteractionMode.PLACE_BLOCK) {
            Deck.instance.chooseCards([this.getCardSlot()]);
        }
        this.getCardClick().close();
    }

    getCardClick(): Click {
        return this.getComponent(Proxy)?.target?.getComponent(Click);
    }

    getCardSlot(): SlotView {
        return this.getComponent(Proxy)?.target?.getComponent(SlotView);
    }

    getCard(): MagicCardView {
        return this.getCardSlot().getComponentInChildren(MagicCardView);
    }
}


