import { _decorator, Component, Node } from 'cc';
import { SlotView } from './SlotView';
const { ccclass, property } = _decorator;

@ccclass('HandView')
export class HandView extends Component {
    @property([SlotView])
    slots: Array<SlotView> = []
}


