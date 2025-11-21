import { _decorator, Component, Enum, Node, randomRangeInt, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { Behavior, ChoiceStrategy } from './Behavior';
import { GameMap } from '../island-defense/GameMap';
import { Completer, Info } from '../toolkits/Functions';
import { UnitView } from '../island-defense/UnitView';
import { SlotView } from '../common-view/SlotView';
const { ccclass, property } = _decorator;

@ccclass('MoveBehavior')
export class MoveBehavior extends Behavior {
    @property({type:Enum(ChoiceStrategy)})
    strategy: ChoiceStrategy = ChoiceStrategy.NEAREST
    @property
    velocity: number = 20
    @property
    matchInfoKeyPath: string = "sea"
    @property
    declare exclude: Set<SlotView>

    matchInfo: Info = null

    matchCache: SlotView = null

    completer: Completer<void> = new Completer

    protected start(): void {
        this.exclude = new Set;
    }

    protected onEnable(): void {
        if (this.completer != null) {
            this.completer.complete();
        }
        this.restart();
    }

    restart() {
        this.completer = new Completer;
        this.matchCache = null;
        this.exclude = new Set;
    }

    getMatch(): Array<SlotView> {
        if (this.matchInfoKeyPath == 'any') {
            return GameMap.instance.neighborBlocks(this.unit.node.worldPosition, this.exclude);
        }
        else if (this.matchInfoKeyPath == 'sea') {
            return GameMap.instance.nearestSeas(this.unit.node.worldPosition);
        }

        let info = this.matchInfo;
        if (info == null && this.matchInfoKeyPath.startsWith('@')) {
            info = GameMap.instance.baseInfo.unref(this.matchInfoKeyPath);
        }

        if (info != null) {
            GameMap.instance.matchSlots(info);
        }
        return null;
    }

    march(worldPosition: Vec3, deltaTime: number) {
        const targetPosition = GameMap.instance.worldToMapPosition(worldPosition);
        const currentPosition = GameMap.instance.worldToMapPosition(this.unit.node.worldPosition);
        const vector = targetPosition.clone().subtract(currentPosition);
        if (vector.length() <= deltaTime * this.velocity) {
            this.unit.node.position = targetPosition;
            this.completer.complete();
        }
        else {
            this.unit.node.position = this.unit.node.position.add(vector.normalize().multiplyScalar(deltaTime * this.velocity));
        }

        this.unit.orient = vector.x;
    }

    chooseMatch(): SlotView {
        const matches = this.getMatch();
        if (matches.length == 0) {
            return null;
        }
        return matches[randomRangeInt(0, matches.length)];
    }

    enterCondition(): boolean {
        if (this.matchCache == null) {
            this.matchCache = this.chooseMatch();
        }
        return this.matchCache != null && this.matchCache.node.worldPosition != this.unit.node.worldPosition;
    }

    program(deltaTime: number): void {
        if (this.unit == null) return;
        const slot = this.matchCache == null ? this.chooseMatch() : this.matchCache;
        if (slot != null) {
            this.march(slot.node.worldPosition, deltaTime);
        }
    }
}


