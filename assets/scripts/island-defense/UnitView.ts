import { _decorator, Component, Node } from 'cc';
import { Behavior } from '../behavior-tree/Behavior';
const { ccclass, property } = _decorator;

@ccclass('UnitView')
export class UnitView extends Component {
    @property(Behavior)
    behavior: Behavior

    protected update(dt: number): void {
        this.behavior.program(dt);
    }
}


