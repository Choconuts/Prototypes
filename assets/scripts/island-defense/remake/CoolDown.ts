import { _decorator, Button, Component, Node, Size, UITransform } from 'cc';
import { GameMap } from '../GameMap';
const { ccclass, property } = _decorator;

@ccclass('CoolDown')
export class CoolDown extends Component {
    @property
    initSpeed: number = 20
    @property
    totalCapacity: number = 400
    @property
    purifyFactor: number = 1

    @property
    value: number = 400

    @property(Button)
    button: Button

    @property(Size)
    initMaskSize: Size

    protected onLoad(): void {
        this.initMaskSize = this.getComponent(UITransform).contentSize.clone();
    }

    cooldown() {
        return this.value >= this.totalCapacity;
    }

    reset() {
        this.value = 0;
    }

    update(deltaTime: number) {
        if (this.value < this.totalCapacity) {
            this.value += deltaTime * (this.initSpeed + GameMap.instance.totalPurify * this.purifyFactor);
            this.button.interactable = false;
            this.updateMask();
        }
        else {
            this.button.interactable = true;
            this.updateMask();
        }
    }

    updateMask() {
        const coolDownMask = this.getComponent(UITransform);
        coolDownMask.setContentSize(new Size(this.initMaskSize.x, this.initMaskSize.y * this.value / this.totalCapacity));
    }
}


