import { _decorator, Component, Enum, Node } from 'cc';
const { ccclass, property } = _decorator;


export enum InteractionMode {
    IDLE = 'interaction-idle',
    PLACE_BLOCK = 'interaction-place-block',
}

@ccclass('InteractionManager')
export class InteractionManager extends Component {
    static declare instance: InteractionManager

    @property({type: Enum(InteractionMode)})
    mode: InteractionMode = InteractionMode.IDLE


    protected onLoad(): void {
        InteractionManager.instance = this;
    }
}


