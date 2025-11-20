import { _decorator, Component, Enum, Node, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { Behavior, ChoiceStrategy } from './Behavior';
import { GameMap } from '../island-defense/GameMap';
import { Info } from '../toolkits/Functions';
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

    matchInfo: Info = null

    @property(UnitView)
    unit: UnitView = null

    protected onLoad(): void {
        if (this.unit == null) {
            let parent = this.node;
            while (parent != null) {
                this.unit = parent.getComponent(UnitView);
                if (this.unit != null) {
                    break;
                }
                parent = parent.parent;
            }
        }
    }

    getMatch(): SlotView {
        if (this.matchInfoKeyPath == 'any') {
            if (this.strategy == ChoiceStrategy.NEAREST) {
                return GameMap.instance.nearestBlock(this.unit.node.worldPosition);
            }
        }
        else if (this.matchInfoKeyPath == 'sea') {
            if (this.strategy == ChoiceStrategy.NEAREST) {
                return GameMap.instance.nearestSea(this.unit.node.worldPosition);
            }
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
        }
        else {
            this.unit.node.position = this.unit.node.position.add(vector.normalize().multiplyScalar(deltaTime * this.velocity));
        }
    }

    program(deltaTime: number): void {
        if (this.unit == null) return;
        const slot = this.getMatch();
        if (slot != null) {
            this.march(slot.node.worldPosition, deltaTime);
        }
    }
}


