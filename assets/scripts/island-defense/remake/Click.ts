import { _decorator, Component, Node, NodeEventType } from 'cc';
import { Proxy } from '../../proxy-manager/Proxy';
import { GameManager } from '../../proxy-manager/GameManager';
import { Completer } from '../../toolkits/Functions';
import { InteractionManager, InteractionMode } from './InteractionManager';
import { SlotView } from '../../common-view/SlotView';
import { GameMap } from '../GameMap';
import { DeepSea } from './DeepSea';
import { Deck } from './Deck';
import { Factory } from '../../proxy-manager/Factory';
import { BlockView } from '../BlockView';
import { MagicCardView } from '../MagicCardView';
const { ccclass, property } = _decorator;

@ccclass('Click')
export class Click extends Component {
    @property
    proxyKey: string = 'default-click'
    @property
    proxy?: Proxy = null


    protected onLoad(): void {
        this.node.on(NodeEventType.MOUSE_DOWN, (event) => {
            if (this.proxyKey == 'click-block') {
                if (InteractionManager.instance.mode == InteractionMode.IDLE) {
                    this.startPlaceBlock();
                }
                else if (InteractionManager.instance.mode == InteractionMode.PLACE_BLOCK) {
                    this.endPlaceBlock();
                }
            }
            else if (this.proxyKey == 'click-card') {
                this.clickCard();
            }
        });

        this.node.on(NodeEventType.MOUSE_UP, (event) => {
            this.proxy?.send(Proxy.Event.CANCEL);
        });
    }

    endPlaceBlock() {
        InteractionManager.instance.endGenerateBlock(InteractionManager.instance.generateBlock == this.getComponent(SlotView));
    }

    async startPlaceBlock() {
        const slot = this.getComponent(SlotView);
        await InteractionManager.instance.startGenerateBlock(slot);
    }

    protected async clickCard() {
        const slot = this.getComponent(SlotView);
        if (InteractionManager.instance.mode == InteractionMode.PLACE_BLOCK) {
            const chosen = await Deck.instance.chooseCards([slot]);
            for (let i = 0; i < chosen.length; i++) {
                if (Deck.instance.chosenBlock != null) break;
                if (slot != chosen[i]) {
                    await Deck.instance.chooseCards([chosen[i]]);
                }
            }
            InteractionManager.instance.updateGenerateBlock();
        }
        else if (InteractionManager.instance.mode == InteractionMode.IDLE) {
            InteractionManager.instance.startPlayCard(slot);
        }
        else if (InteractionManager.instance.mode == InteractionMode.BUY_CARD) {
            InteractionManager.instance.chooseCard(slot);
        }
    }
}


