import { _decorator, Component, Node } from 'cc';
import { MoveBehavior } from '../behavior-tree/MoveBehavior';
import { DeriveBehavior } from '../behavior-tree/DeriveBehavior';
const { ccclass, property } = _decorator;

@ccclass('Boat')
export class Boat extends Component {
    start() {
        const derive = this.getComponentInChildren(DeriveBehavior);
        const move = this.getComponentInChildren(MoveBehavior);
        move.completer.promise.then(() => {
            derive.deriveMode = true;
        });

    }
}


