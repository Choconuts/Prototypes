import { _decorator, Component, Node, Sprite } from 'cc';
import { Info } from '../../toolkits/Functions';
import { ArtData } from '../../proxy-manager/ArtData';
const { ccclass, property } = _decorator;

@ccclass('LoadPicture')
export class LoadPicture extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    load(info: Info) {
        const img = info.get('display').get('sprite').data;
        const sprite = ArtData.instance.get(img);
        console.log(sprite);
        this.getComponent(Sprite).spriteFrame = sprite;
    }
}


