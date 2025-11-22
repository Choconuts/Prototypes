import { _decorator, Color, Component, Label, Node, NodeEventType, v3 } from 'cc';
import { GridView } from '../../common-view/GridView';
import { GameManager } from '../../proxy-manager/GameManager';
import { Deck } from './Deck';
import { InteractionManager, InteractionMode } from './InteractionManager';
import { Click } from './Click';
import { createWidgetChild } from '../../toolkits/Functions';
import { SlotView } from '../../common-view/SlotView';
import { MagicCardView } from '../MagicCardView';
const { ccclass, property } = _decorator;

@ccclass('SpiritShop')
export class SpiritShop extends Component {
    @property(GridView)
    gridView: GridView
    @property
    refreshCost: number = 1
    @property([Label])
    costLabels: Array<Label>
    @property(Label)
    refreshLabel: Label

    protected start(): void {
        GameManager.instance.gameReady.then(() => {
            this.createLabels();
            this.refresh();
        });
    }

    toggle() {
        this.updateAllCostLabels();
        InteractionManager.instance.buyCard().then((buy) => {
            this.node.active = buy;
            InteractionManager.instance.completer.promise.then((slot) => {
                this.node.active = InteractionManager.instance.mode == InteractionMode.BUY_CARD;
                this.refresh();
            });
        })
    }

    costRefresh() {
        if (Deck.instance.spirit < this.refreshCost) return;
        Deck.instance.gainSpirit(-this.refreshCost);
        this.refresh();
    }

    createLabels() {
        this.costLabels = [];
        this.gridView.slots.forEach((slot, index) => {
            const widget = createWidgetChild(slot, 'cost');
            widget.isAlignBottom = true;
            widget.bottom = -50;
            const label = widget.addComponent(Label);
            label.string = '-1 灵魂';
            label.fontSize = 24;
            label.color = new Color(0, 0, 0, 255);
            this.costLabels.push(label);

            slot.node.on(NodeEventType.MOUSE_ENTER, (event) => {
                this.hoverSlot(slot, true);
            });

            slot.node.on(NodeEventType.MOUSE_LEAVE, (event) => {
                this.hoverSlot(slot, false);
            });
        });
    }

    updateAllCostLabels() {
        this.gridView.slots.forEach((slot, index) => {
            const card = slot.getComponentInChildren(MagicCardView);
            if (card != null) {
                this.updateCostLabel(index, card.getCost());
            }
        });

        if (Deck.instance.hasSpirit(this.refreshCost)) {
           this.refreshLabel.color = new Color(0, 0, 0, 255);
        }
        else {
            this.refreshLabel.color = Color.RED;
        } 
    }

    updateCostLabel(index: number, cost: number) {
        this.costLabels[index].string = '-' + cost + ' 灵魂';
        if (Deck.instance.hasSpirit(cost)) {
            this.costLabels[index].color = new Color(0, 0, 0, 255);
        }
        else {
            this.costLabels[index].color = Color.RED;
        }
    }

    hoverSlot(slot: SlotView, enter: boolean) {
        const card = slot.getComponentInChildren(MagicCardView);
        if (enter) {
            if (card != null) {
                card.node.scale = v3(1.05, 1.05, 1);
            }
        }
        else {
            if (card != null) {
                card.node.scale = v3(1, 1, 1);
            }
        }
    }

    refresh() {
        const cards = Deck.instance.randomCardsFromPool(this.gridView.gridNum.x);
        this.gridView.slots.forEach((slot, index) => {
            const prevCard = slot.getComponentInChildren(MagicCardView);
            if (prevCard != null) {
                prevCard.node.destroy();
            }

            const click = slot.addComponent(Click);
            click.proxyKey = 'click-card';
            const cardNode = cards[index].node;
            slot.node.addChild(cardNode);

            this.updateCostLabel(index, cards[index].getCost());
        });
    }
}


