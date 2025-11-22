import { _decorator, Component, Node } from 'cc';
import { Click } from './Click';
import { SlotView } from '../../common-view/SlotView';
import { BlockView } from '../BlockView';
import { Proxy } from '../../proxy-manager/Proxy';
const { ccclass, property } = _decorator;

@ccclass('ClickBlock')
export class ClickBlock extends Component {

    protected onEnable(): void {
        console.log('clicked', this.getBlockSlot().coord.x, this.getBlock().blockType);
        this.getBlockClick().close();
    }

    getBlockClick(): Click {
        return this.getComponent(Proxy)?.target?.getComponent(Click);
    }

    getBlockSlot(): SlotView {
        return this.getComponent(Proxy)?.target?.getComponent(SlotView);
    }

    getBlock(): BlockView {
        return this.getBlockSlot().getComponentInChildren(BlockView);
    }
}


