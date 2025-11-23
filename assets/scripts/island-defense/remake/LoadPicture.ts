import { _decorator, Component, Node, Sprite, UITransform } from 'cc';
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
        const aspectRatio = sprite.originalSize.y / sprite.originalSize.x;
        const ui = this.getComponent(UITransform);
        ui.setContentSize(ui.contentSize.x, ui.contentSize.x * aspectRatio);
        this.getComponent(Sprite).spriteFrame = sprite;
    }
}


