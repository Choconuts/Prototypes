import { _decorator, Component, Node, v2 } from 'cc';
import { Proxy, ProxyEvent } from '../proxy-manager/Proxy';
import { PlayCard } from './PlayCard';
import { SlotView } from '../common-view/SlotView';
import { BlockPattern, GameMap } from './GameMap';
const { ccclass, property } = _decorator;

@ccclass('CardEffect')
export class CardEffect extends Component {
    protected onEnable(): void {
        this.selectEmptyBlocks();
    }

    selectEmptyBlocks() {
        const playCard = this.getComponent(Proxy).target?.getComponent(PlayCard);
        if (playCard == null) {
            this.getComponent(Proxy)?.close();
            return;
        }

        playCard.setGridHover((slot) => this.canPlaceBlock(slot));

        this.process();
    }

    canPlaceBlock(slot: SlotView): boolean {
        const pattern = new BlockPattern;
        pattern.target = 'empty';
        pattern.neighbors.set(3, 'any');
        const match = GameMap.instance.matchPattern(slot.coord, pattern);
        return match && !GameMap.instance.hasEnemy(slot);
    }

    async process(): Promise<void> {
        const proxy = this.getComponent(Proxy);
        const cardInfo = await proxy?.wait(ProxyEvent.COMMIT);
        const blockType = cardInfo.get('block-type').data;
        const coordInfo = await proxy?.wait(ProxyEvent.COMMIT);
        const coord = coordInfo.get('coord').data;
        const block = GameMap.instance.generateBlock(coord, blockType);
        await proxy?.wait(ProxyEvent.CANCEL);
        proxy?.close();
    }
}

