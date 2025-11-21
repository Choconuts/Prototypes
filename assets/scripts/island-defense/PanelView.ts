import { _decorator, Component, Node } from 'cc';
import { Info } from '../toolkits/Functions';
import { GridView } from '../common-view/GridView';
import { Factory } from '../proxy-manager/Factory';
import { GameManager } from '../proxy-manager/GameManager';
import { Library } from '../proxy-manager/Library';
import { ConfigView } from './ConfigView';
const { ccclass, property } = _decorator;

@ccclass('PanelView')
export class PanelView extends Component {
    @property
    configKey: string = 'animal-config-horizon'

    @property
    database: string = 'magic-card-data'

    @property
    isBuilding: boolean = false

    baseInfo: Info

    protected onLoad(): void {
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);

            if (this.isBuilding) {
                this.setAnimalSlot(this.baseInfo.get('building-type').get('village'), 0);
                this.setAnimalSlot(this.baseInfo.get('building-type').get('factory'), 1);
            }
            else {
                this.setAnimalSlot(this.baseInfo.get('animal-type').get('lion'), 0);
                this.setAnimalSlot(this.baseInfo.get('animal-type').get('turtoise'), 1);
                this.setAnimalSlot(this.baseInfo.get('animal-type').get('fox'), 2);
                this.setAnimalSlot(this.baseInfo.get('animal-type').get('lizard'), 3);
            }

        });
    }

    setAnimalSlot(info: Info, slotIndex: number): boolean {
        const slots = this.getComponent(GridView)?.slots;

        if (slots == null || slots.length <= slotIndex || slotIndex < 0) {
            return false;
        }

        const slot = slots[slotIndex];
        const config = Factory.instance.get(this.configKey);

        if (config == null) {
            return false;
        }

        slot.node.addChild(config);
        config.getComponent(ConfigView)?.apply(info);

        return true;
    }
}


