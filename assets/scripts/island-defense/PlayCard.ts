import { _decorator, Color, Component, Graphics, Node } from 'cc';
import { DefaultDragCard } from '../common-view/DefaultDragCard';
import { GameMap } from './GameMap';
import { GridView } from '../common-view/GridView';
import { Hover } from '../common-modal/Hover';
import { HoverDrop } from './HoverDrop';
import { MagicCardView } from './MagicCardView';
import { GameManager } from '../proxy-manager/GameManager';
import { Proxy, ProxyEvent } from '../proxy-manager/Proxy';
import { createWidgetChild, Info } from '../toolkits/Functions';
import { SlotView } from '../common-view/SlotView';
import { BlockView } from './BlockView';
import { RectView } from '../toolkits/RectView';
import { CardView } from '../common-view/CardView';
import { HandView } from '../common-view/HandView';
const { ccclass, property } = _decorator;

@ccclass('PlayCard')
export class PlayCard extends DefaultDragCard {
    @property
    effectKey: string = 'card-effect'
    @property
    hoverKey: string = 'hover-drop'

    declare effect: Proxy
    visuals: Node[] = []


    public startDrag(): void {
        super.startDrag();
        let magicCard = this.getDrag().getComponentInChildren(MagicCardView);
        if (magicCard == null) {
            magicCard = this.wrapNode.getComponentInChildren(MagicCardView);
        }
        
        if (magicCard != null) {
            this.effect = GameManager.instance.rootProxy.createProxy(this.node, this.effectKey);
            this.effect?.send(ProxyEvent.COMMIT, magicCard.info);
        }
    }

    public cancelDrag(): void {
        if (HoverDrop.focus == null) {
            super.cancelDrag();
            this.effect?.close();
        }
        else {
            const hoverBlock = HoverDrop.focus.getHover().node.parent.getComponent(SlotView);
            if (hoverBlock != null) {
                this.effect?.send(ProxyEvent.COMMIT, Info.Empty({"coord": hoverBlock.coord}));
            }
            this.removeWrapNode();
            this.getDrag().dragEnd();
            this.effect?.send(ProxyEvent.CANCEL);
            this.removeCard();
        }
    }

    protected onDisable(): void {
        super.onDisable();
        this.visuals.forEach((visual, index, array) => {
            const hover = visual.getComponent(Hover);
            hover.proxy?.close();
            hover.destroy();
            visual.active = false;
        });
        HoverDrop.focus = null;
    }

    setGridHover(predict: (slot: SlotView) => boolean) {
        const gridView = GameMap.instance.gridView;
        gridView.slots.forEach((slot, index, array) => {
            if (predict(slot) && slot.selectionMaskView != null && !GameMap.instance.hasEnemy(slot)) {
                this.visuals.push(slot.selectionMaskView);
                slot.selectionMaskView.active = true;
                const hover = slot.selectionMaskView.addComponent(Hover);
                hover.proxyKey = this.hoverKey;
            }
        });
    }

    removeCard() {
        const card = this.getDrag().getComponentInChildren(CardView);
        const slot = card.getContainer(SlotView);
        const hand = card.getContainer(HandView);
        card.node.active = false;
        hand.removeCard(slot.coord.x);
    }
}


