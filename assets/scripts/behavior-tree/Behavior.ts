import { _decorator, Component, Enum, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum ChoiceStrategy {
    NEAREST = 0,
    RANDOM = 1,
    MAX_ENEMY = 2,
}


@ccclass('Behavior')
export class Behavior extends Component {
    @property
    selective: boolean = true

    enterCondition(): boolean {
        return true;
    }

    program(deltaTime: number) {
        for (const child of this.node.children) {
            const childBehavior = child.getComponent(Behavior);
            if (childBehavior?.enterCondition()) {
                childBehavior.program(deltaTime);
                if (this.selective) {
                    break;
                }
            }
        }
    }
}


