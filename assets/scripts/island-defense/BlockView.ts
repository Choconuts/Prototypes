import { _decorator, Color, Component, Graphics, Node } from 'cc';
import { Completer, createWidgetChild, Info } from '../toolkits/Functions';
import { RectView } from '../toolkits/RectView';
import { GameManager } from '../proxy-manager/GameManager';
import { Library } from '../proxy-manager/Library';
const { ccclass, property } = _decorator;

@ccclass('BlockView')
export class BlockView extends Component {
    @property
    database: string = 'magic-card-data'
    @property
    blockType: string = null

    baseInfo: Info
    info: Info

    lock: Completer<void> = new Completer

    protected onLoad(): void {
        this.info = Info.Empty(null);
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);
            this.lock.complete();
        });
    }

    async addBlock(blockType): Promise<boolean> {
        if (this.blockType != null) return false;
        await this.lock?.promise;
        this.lock = new Completer;
        this.blockType = blockType;
        const widget = createWidgetChild(this, blockType, {expandPadding: 0});
        const graphics = widget.addComponent(Graphics);
        const rect = widget.addComponent(RectView);
        rect.radius = 5;
        this.info = this.baseInfo.get('block-type').get(blockType);
        graphics.fillColor = Color.fromHEX(new Color, this.info.get('card-color')?.data);
        this.lock.complete();
        return true;
    }
}


