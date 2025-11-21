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
    @property
    maxNum: number = -1

    @property(UnitView)
    unit: UnitView = null

    delay = 0

    completer: Completer<void> = new Completer

    enterCondition(): boolean {
        return this.deriveMode;
    }

    derive() {
        if (this.maxNum != 0) {
            const coord = GameMap.instance.worldPositionToCoord(this.unit.node.worldPosition);
            const derived = GameMap.instance.generateUnit(coord, this.deriveKey, false);
            this.completer.complete();
            derived.orient = this.unit.orient;

            if (this.maxNum > 0) this.maxNum--;
        }
    }

    program(deltaTime: number): void {
        if (this.delay - deltaTime < 0) {
            this.derive();
            this.delay = this.interval + this.delay - deltaTime;
        }
        else {
            this.delay -= deltaTime;
        }
    }
}


