import { _decorator, Component, Layers, Layout, Node, Size, UITransform, v2, Vec2, Widget } from 'cc';
import { SlotView } from './SlotView';
const { ccclass, property } = _decorator;

@ccclass('GridView')
export class GridView extends Component {
    @property(Vec2)
    gridNum: Vec2 = v2(10, 6)
    @property(Size)
    gridSize: Size = new Size(200, 200)

    protected onLoad(): void {
        for (let i = 0; i < this.gridNum.x; i++) {
            for (let j = 0; j < this.gridNum.y; j++) {
                const slot = this.createSlot(i, j);
                this.node.addChild(slot.node);
            }
        }
    }

    setLayout() {
        const layout = this.getComponent(Layout);
        layout.type = Layout.Type.GRID;
        layout.constraint = Layout.Constraint.FIXED_COL;
        layout.constraintNum = this.gridNum.x;
    }

    createSlot(i: number, j: number): SlotView {
        const node = new Node;
        node.name = this.node.name + "-grid-" + i + '-' + j;
        const slot = node.addComponent(SlotView);
        const widget = node.addComponent(Widget);

        const transform = slot.getComponent(UITransform);
        transform.setContentSize(this.gridSize);

        const totalSize = new Size(this.gridSize.x * this.gridNum.x, this.gridSize.y * this.gridNum.y)
        this.getComponent(UITransform).setContentSize(totalSize);
        return slot;
    }
}


