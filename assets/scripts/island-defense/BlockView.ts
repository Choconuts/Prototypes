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
    blockType: string = ''
    @property
    changeColor: boolean = false
    @property(Color)
    newColor: Color = Color.BLACK
    @property
    innerPadding: number = 0
    @property
    rectWidget: RectView = null

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
        const widget = createWidgetChild(this, blockType, { expandPadding: this.innerPadding });
        const graphics = widget.addComponent(Graphics);
        const rect = widget.addComponent(RectView);
        rect.radius = 5;
        this.info = this.baseInfo.get('block-type').get(blockType);
        graphics.fillColor = Color.fromHEX(new Color, this.info.get('card-color')?.data);

        if (this.changeColor) {
            const graphics = this.getComponent(Graphics);
            graphics.fillColor = Color.fromHEX(new Color, '#F1E9CB');
            this.getComponent(RectView).draw();
        }
        this.rectWidget = rect;
        this.lock.complete();
        return true;
    }

    async changeBlock(blockType): Promise<boolean> {
        await this.lock?.promise;
        this.lock = new Completer;

        if (blockType != null) {
            if (this.rectWidget == null) {
                this.lock.complete();
                return this.addBlock(blockType);
            }
            else {
                this.rectWidget.node.active = true;
                this.info = this.baseInfo.get('block-type').get(blockType);
                const graphics = this.rectWidget.getComponent(Graphics);
                graphics.fillColor = Color.fromHEX(new Color, this.info.get('card-color')?.data);
                this.rectWidget.draw();
                this.lock.complete();
                return true;
            }
        }
        else {
            if (this.rectWidget != null) {
                this.rectWidget.node.active = false;
            }
        }

        this.lock.complete();
        return true;
    }
}


