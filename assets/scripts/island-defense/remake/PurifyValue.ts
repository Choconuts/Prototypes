import { _decorator, Component, Label, Node } from 'cc';
import { GameMap } from '../GameMap';
const { ccclass, property } = _decorator;

@ccclass('PurifyValue')
export class PurifyValue extends Component {
    start() {

    }

    update(deltaTime: number) {
        this.getComponent(Label).string = '净化值：' + GameMap.instance.totalPurify;
    }
}


