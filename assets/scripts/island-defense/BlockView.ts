import { _decorator, Component, Graphics, Node } from 'cc';
import { createWidgetChild } from '../toolkits/Functions';
import { RectView } from '../toolkits/RectView';
const { ccclass, property } = _decorator;

@ccclass('BlockView')
export class BlockView extends Component {
    @property
    database: string = 'magic-card-data'
    @property
    blockType: string = null

    addBlock(blockType): boolean {
        if (this.blockType != null) return false;
        this.blockType = blockType
        const widget = createWidgetChild(this, 'block', {expandPadding: 0});
        const graphics = widget.addComponent(Graphics);
        const rect = widget.addComponent(RectView);
        return true;
    }
}


