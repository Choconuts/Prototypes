import { _decorator, Component, Node, randomRangeInt } from 'cc';
import { Behavior } from './Behavior';
import { GameMap } from '../island-defense/GameMap';
import { SlotView } from '../common-view/SlotView';
import { ProgressView } from '../common-view/ProgressView';
import { Completer } from '../toolkits/Functions';
import { UnitView } from '../island-defense/UnitView';
const { ccclass, property } = _decorator;

@ccclass('AttackBehavior')
export class AttackBehavior extends Behavior {
    @property
    interval: number = 1

    delay = 0

    completer: Completer<void> = new Completer

    slotCache: SlotView = undefined
    objectUnits: Array<UnitView>

    protected onLoad(): void {
        super.onLoad();
        this.objectUnits = [];
    }

    enterCondition(): boolean {
        this.slotCache = GameMap.instance.coordToSlot(GameMap.instance.worldPositionToCoord(this.unit.node.worldPosition));
        if (this.getOpponent() && this.unit.attack > 0) {
            return true;
        }
        else {
            this.delay = 0;
            return false;
        }
    }

    getOpponent(): boolean {
        if (this.slotCache == null) return false;
        if (this.unit.isAnimal) {
            this.objectUnits = GameMap.instance.getEnemies(this.slotCache);
        }
        else {
            this.objectUnits = GameMap.instance.getAnimals(this.slotCache);
        }
        return this.objectUnits.length > 0;
    }

    attack() {
        const target = this.objectUnits[randomRangeInt(0, this.objectUnits.length)];
        target.dealDamage(this.unit.attack);
    }

    program(deltaTime: number): void {
        if (this.delay - deltaTime < 0) {
            if (this.objectUnits.length > 0) {
                this.attack();
            }
            this.completer.complete();
            this.delay = this.interval
        }
        else {
            this.delay -= deltaTime;
        }
    }
}


