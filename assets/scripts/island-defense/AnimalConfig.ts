import { _decorator, Component, Mask, Node, Size, UITransform, v2 } from 'cc';
import { ConfigView } from './ConfigView';
import { Info } from '../toolkits/Functions';
import { GameMap } from './GameMap';
const { ccclass, property } = _decorator;

@ccclass('AnimalConfig')
export class AnimalConfig extends Component {
    @property
    unitKey: string = 'default-unit'
    @property(ConfigView)
    configView: ConfigView
    @property(UITransform)
    coolDownMask: UITransform

    @property
    countSeconds: number = 10

    @property
    counter: number = 10

    @property(Size)
    coolDownMaskSize: Size

    workingInfo: Info = null

    protected onLoad(): void {
        this.configView = this.getComponent(ConfigView);
        this.register();
        this.coolDownMaskSize = this.coolDownMask.contentSize.clone();
    }

    register(info?: Info) {
        if (info != null) {
            this.process(info);
        }
        this.configView.eventStream.get().then((info) => this.register(info));
    }

    process(info: Info) {
        this.counter = this.countSeconds;
        this.workingInfo = info;
    }

    async tryWork(): Promise<boolean> {
        const creature = await GameMap.instance.generateCreature(this.workingInfo, this.unitKey, true);
        return creature != null;
    }

    protected update(dt: number): void {
        if (this.workingInfo != null) {
            if (this.counter >= this.countSeconds) {
                this.tryWork().then((success) => {
                    if (success) {
                        this.counter = this.counter - this.countSeconds;
                    }
                });
            }
            else {
                this.counter += dt;
                this.coolDownMask.setContentSize(new Size(this.coolDownMaskSize.x * this.counter / this.countSeconds, this.coolDownMaskSize.y));
            }
        }
        else {
            this.coolDownMask.setContentSize(this.coolDownMaskSize);
        }
    }
}


