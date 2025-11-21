import { _decorator, Component, Node } from 'cc';
import { MoveBehavior } from '../behavior-tree/MoveBehavior';
import { Completer } from '../toolkits/Functions';
import { UnitView } from './UnitView';
import { Unit } from './Unit';
const { ccclass, property } = _decorator;

@ccclass('EnemyUnit')
export class EnemyUnit extends Unit {
    onEnable() {
        const move = this.getComponentInChildren(MoveBehavior);
        this.restartMove(move);
        this.getComponent(UnitView).dealDamage(0);
    }

    restartMove(move: MoveBehavior) {
        move.completer.promise.then(() => {
            move.exclude.add(move.matchCache);
            if (move.getMatch().length == 0) {
                move.exclude.clear();
                move.exclude.add(move.matchCache);
            }
            move.restart();
            this.restartMove(move);
        });
    }


}


