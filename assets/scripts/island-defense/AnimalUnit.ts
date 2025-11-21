import { _decorator, Component, Node } from 'cc';
import { Info } from '../toolkits/Functions';
import { UnitView } from './UnitView';
import { Unit } from './Unit';
const { ccclass, property } = _decorator;

@ccclass('AnimalUnit')
export class AnimalUnit extends Unit {
    start() {

    }

    update(deltaTime: number) {
        
    }

    apply(info: Info) {
        const unit = this.getComponent(UnitView);
        unit.maxHealth = info.get('attributes').get('health').data;
        unit.health = unit.maxHealth;
        unit.attack = info.get('attributes').get('attack').data;
        unit.purify = info.get('attributes').get('purify').data;

        unit.dealDamage(0);
    }
}


