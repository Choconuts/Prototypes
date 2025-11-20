import { _decorator, Component, Enum, Node } from 'cc';
import { UnitView } from '../island-defense/UnitView';
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
    @property(UnitView)
    unit: UnitView = null

    protected onLoad(): void {
        if (this.unit == null) {
            let parent = this.node;
            while (parent != null) {
                this.unit = parent.getComponent(UnitView);
                if (this.unit != null) {
                    break;
                }
                parent = parent.parent;
            }
        }
    }

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


