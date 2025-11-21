import { _decorator, Component, Node } from 'cc';
import { Completer } from '../toolkits/Functions';
import { SlotView } from '../common-view/SlotView';
import { UnitView } from './UnitView';
import { GameMap } from './GameMap';
import { Behavior } from '../behavior-tree/Behavior';
import { MoveBehavior } from '../behavior-tree/MoveBehavior';
const { ccclass, property } = _decorator;

@ccclass('BuildBehavior')
export class BuildBehavior extends Behavior {
    @property
    interval: number = 1
    @property
    initialDelay: number = 0
    @property(MoveBehavior)
    mover: MoveBehavior

    delay = 0

    completer: Completer<void> = new Completer

    slotCache: SlotView = undefined
    objectUnits: Array<UnitView>

    @property
    working: boolean = true

    protected onLoad(): void {
        super.onLoad();
        this.objectUnits = [];
        this.delay = this.initialDelay;
    }

    async waitMove() {
        if (this.mover != null) {
            await this.mover.completer.promise;
            this.working = true;
        }
    }

    enterCondition(): boolean {
        this.slotCache = GameMap.instance.coordToSlot(GameMap.instance.worldPositionToCoord(this.unit.node.worldPosition));
        if (!this.unit.isAnimal && !this.unit.isBuilding && this.getIncompleteBuilding()) {
            if (!this.working) {
                this.waitMove();
            }
            return this.working;
        }
        else {
            this.delay = this.initialDelay;
            this.working = false;
            return false;
        }
    }

    getIncompleteBuilding(): boolean {
        if (this.slotCache == null) return false;
        this.objectUnits = GameMap.instance.getIncompleteBuilding(this.slotCache);
        return this.objectUnits.length == 1;
    }

    attack() {
        const target = this.objectUnits[0];
        target.dealDamage(-1);
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


