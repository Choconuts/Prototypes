import { _decorator, Component, Node } from 'cc';
import { Behavior } from './Behavior';
import { GameMap } from '../island-defense/GameMap';
import { UnitView } from '../island-defense/UnitView';
import { Completer } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('DeriveBehavior')
export class DeriveBehavior extends Behavior {
    @property
    deriveMode: boolean = false
    @property
    deriveKey: string = 'default-unit'
    @property
    interval: number = 10

    @property(UnitView)
    unit: UnitView = null

    delay = 0

    completer: Completer<void> = new Completer

    enterCondition(): boolean {
        return this.deriveMode;
    }

    program(deltaTime: number): void {
        if (this.delay - deltaTime < 0) {
            const coord = GameMap.instance.worldPositionToCoord(this.unit.node.worldPosition);
            const derived = GameMap.instance.generateUnit(coord, this.deriveKey, false);
            this.completer.complete();
            this.delay = this.interval + this.delay - deltaTime;
            derived.orient = this.unit.orient;
        }
        else {
            this.delay -= deltaTime;
        }
    }
}


