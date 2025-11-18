import { _decorator, Component, Layers, Layout, Node, Size, UITransform, v2, Vec2, Widget } from 'cc';
import { SlotView } from './SlotView';
import { getOrAddComponent } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('GridView')
export class GridView extends Component {
    @property(Vec2)
    gridNum: Vec2 = v2(10, 6)
    @property(Size)
    gridSize: Size = new Size(200, 200)

    @property([SlotView])
    slots: Array<SlotView> = []

    protected onLoad(): void {
        this.setLayout();
        for (let j = 0; j < this.gridNum.y; j++) {
            for (let i = 0; i < this.gridNum.x; i++) {
                const slot = this.createSlot(i, j);
                this.node.addChild(slot.node);
            }
        }
    }

    setLayout() {
        const layout = getOrAddComponent(this, Layout);
        layout.type = Layout.Type.GRID;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.startAxis = Layout.AxisDirection.HORIZONTAL;
        layout.constraint = Layout.Constraint.FIXED_COL;
        layout.constraintNum = this.gridNum.x;
    }

    createSlot(i: number, j: number): SlotView {
        const node = new Node;
        node.name = 'slot' + '-' + i + '-' + j;
        const slot = node.addComponent(SlotView);
        const widget = node.addComponent(Widget);
        slot.coord = v2(i, j);
        const transform = slot.getComponent(UITransform);
        transform.setContentSize(this.gridSize);

        const totalSize = new Size(this.gridSize.x * this.gridNum.x, this.gridSize.y * this.gridNum.y)
        this.getComponent(UITransform).setContentSize(totalSize);

        this.slots.push(slot);
        return slot;
    }

    coordToIndex(coord: Vec2) {
        return coord.y * this.gridNum.x + coord.x;
    }

    indexToCoord(index: number) {
        const j = index % this.gridNum.x;
        return v2((index - j) / this.gridNum.x, j);
    }

    validCoord(coord: Vec2) {
        const xOut = coord.x < 0 || coord.x >= this.gridNum.x;
        const yOut = coord.y < 0 || coord.y >= this.gridNum.y;
        return !(xOut || yOut);
    }

    getNeighborCoords(coord: Vec2, allowOutBound: boolean = false) {
        const neighborCoords: Array<Vec2> = [];
        const offsets = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
        for (const offset of offsets) {
            const neighborCoord = v2(coord.x + offset[0], coord.y + offset[1]);
            if (allowOutBound || this.validCoord(neighborCoord)) {
                neighborCoords.push(neighborCoord);
            }
        }
        return neighborCoords;
    }

    getSlotView(coord: Vec2) {
        if (!this.validCoord(coord)) return null;
        return this.slots[this.coordToIndex(coord)];
    }

    getSlotsNeighbors(slotView: SlotView, allowOutBound: boolean = false) {
        const neighborSlotViews: Array<SlotView> = [];
        const neighbors = this.getNeighborCoords(slotView.coord, allowOutBound);
        for (const neighborCoord of neighbors) {
            const neighborSlotView = this.getSlotView(neighborCoord);
            neighborSlotViews.push(neighborSlotView);
        }
        return neighborSlotViews;
    }
}


