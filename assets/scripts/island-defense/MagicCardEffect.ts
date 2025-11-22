import { _decorator, Component, Node, randomRangeInt, Vec2 } from 'cc';
import { PlayCard } from './PlayCard';
import { Proxy, ProxyEvent } from '../proxy-manager/Proxy';
import { SlotView } from '../common-view/SlotView';
import { GameMap } from './GameMap';
import { Completer, Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('MagicCardEffect')
export class MagicCardEffect extends Component {
    @property
    particleKey: 'magic-particle'

    completer: Completer<Info>

    protected onEnable(): void {
        this.completer = new Completer;
        this.process();
        this.selectTargetBlocks();
    }

    async selectTargetBlocks() {
        const info = await this.completer.promise;
        const playCard = this.getComponent(Proxy).target?.getComponent(PlayCard);
        if (playCard == null) {
            this.getComponent(Proxy)?.close();
            return;
        }

        const matches = GameMap.instance.matchSlots(info);
        const matcheSet = new Set(matches);
        playCard.setGridHover((slot) => matcheSet.has(slot));

        this.process();
    }

    effect(info: Info, coord: Vec2) {
        const attributes = info.get('attributes');
        const damage = attributes.get('attack').data;
        const enemies = GameMap.instance.getEnemies(GameMap.instance.coordToSlot(coord));
        if (enemies.length > 0) {

            if (attributes.get('strategy').data == 'building-first') {
                const buildings = enemies.filter((u, i, a) => u.isBuilding);
                const humen = enemies.filter((u, i, a) => !u.isBuilding);
                if (buildings.length > 0) {
                    const enemy = buildings[randomRangeInt(0, buildings.length)];
                    enemy.dealDamage(damage);
                }
                else {
                    const enemy = humen[randomRangeInt(0, buildings.length)];
                    enemy.dealDamage(damage);
                }
            }
            else if (attributes.get('strategy').data == 'all') {
                for (const enemy of enemies) {
                    console.log('deal', damage)
                    enemy.dealDamage(damage);
                }
            }
        }
    }

    async process(): Promise<void> {
        const proxy = this.getComponent(Proxy);
        const cardInfo = await proxy?.wait(ProxyEvent.COMMIT);
        this.completer.complete(cardInfo);
        const coordInfo = await proxy?.wait(ProxyEvent.COMMIT);
        const coord = coordInfo.get('coord').data;
        this.effect(cardInfo, coord);
        await proxy?.wait(ProxyEvent.CANCEL);
        proxy?.close();
    }
}


