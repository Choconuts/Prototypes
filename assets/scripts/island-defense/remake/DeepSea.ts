import { _decorator, clamp, Color, Component, Graphics, Node } from 'cc';
import { RectView } from '../../toolkits/RectView';
const { ccclass, property } = _decorator;

@ccclass('DeepSea')
export class DeepSea extends Component {
    @property([Color])
    colorList: Array<Color> = []
    @property
    depth: number = 0

    setDepth(depth: number) {
        const graphics = this.getComponent(Graphics);
        depth = Math.floor(depth);
        depth = clamp(depth, 0, this.colorList.length - 1);
        graphics.fillColor = this.colorList[depth];
        this.depth = depth;
    }
}


