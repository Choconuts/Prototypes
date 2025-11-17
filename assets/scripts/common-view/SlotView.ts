import { _decorator, Component, Node, v2, Vec2 } from 'cc';
import { RectView } from '../toolkits/RectView';
const { ccclass, property } = _decorator;

@ccclass('SlotView')
export class SlotView extends Component {
    @property(Vec2)
    coord: Vec2 = v2(0, 0)

}


