import { _decorator, Component, Node } from 'cc';
import { Info } from '../toolkits/Functions';
import { UnitView } from './UnitView';
import { Behavior } from '../behavior-tree/Behavior';
import { DeriveBehavior } from '../behavior-tree/DeriveBehavior';
import { Unit } from './Unit';
const { ccclass, property } = _decorator;

@ccclass('HouseUnit')
export class HouseUnit extends Unit {
    @property
    deriveInterval: number = -1

    start() {

    }

    update(deltaTime: number) {
        if (this.deriveInterval > 0) {
            const derive = this.getComponentInChildren(DeriveBehavior);
            const unit = this.getComponent(UnitView);
            if (unit.isBuildingFinished) {
               derive.setInterval(this.deriveInterval);
            }
        }
    }

    apply(info: Info) {
        const unit = this.getComponent(UnitView);
        const attributes = info.get('attributes');
        unit.maxHealth = attributes.get('health').data;
        unit.health = unit.buildingInitHealth;
        unit.attack = attributes.get('attack').data;
        unit.purify = attributes.get('purify').data;
        unit.isBuildingFinished = false;
        unit.dealDamage(0);

        const interval = attributes.get('derive-interval').data;
        if (interval != null && interval > 0) {
            this.deriveInterval = interval;
        }
    }
}


