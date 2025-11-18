import { _decorator, Color, Component, Graphics, Node, Vec2 } from 'cc';
import { GridView } from '../common-view/GridView';
import { Factory } from '../proxy-manager/Factory';
import { GameManager } from '../proxy-manager/GameManager';
import { Library } from '../proxy-manager/Library';
import { createWidgetChild, Info } from '../toolkits/Functions';
import { SlotView } from '../common-view/SlotView';
import { RectView } from '../toolkits/RectView';
import { Hover } from '../common-modal/Hover';
import { BlockView } from './BlockView';
const { ccclass, property } = _decorator;

export class BlockPattern {
    target: string
    neighbors: Map<number, string> = new Map
}

@ccclass('GameMap')
export class GameMap extends Component {
    static declare instance: GameMap

    @property
    database: string = 'magic-card-data'
    @property
    blockKey: string = 'block-view'
    @property
    gridView: GridView

    @property([BlockView])
    blocks: Array<BlockView> = []

    @property
    visualOpacity: number = 0.4
    baseInfo: Info

    protected onLoad(): void {
        GameMap.instance = this;
        GameManager.instance.gameReady.then(() => {
            const grid = this.getComponent(GridView);
            this.baseInfo = Library.instance.get(this.database);
            grid.slots.forEach((slot, index, array) => {
                const block = Factory.instance.get(this.blockKey);
                slot.node.addChild(block);
                this.blocks.push(block.getComponent(BlockView));
                this.createSelectHover(slot);
            });
            this.gridView = grid;
            this.initLevelMap();
        });
    }

    createSelectHover(slot: SlotView) {
        const visual = createWidgetChild(slot, 'visual', {expandPadding: 0});
        const graphics = visual.addComponent(Graphics);
        const color = Color.fromHEX(new Color, '#88FF88');
        graphics.fillColor = new Color(color.r, color.g, color.b, this.visualOpacity * 255);
        visual.addComponent(RectView);
        visual.node.active = false;
        slot.selectionMaskView = visual.node;
    }

    initLevelMap() {
        const mapInfo = this.baseInfo.get("level-config").get('map');
        for (let i = 0; i < mapInfo.arrayLength; i++) {
            const info = mapInfo.get(i.toString());
            if (info != null) {
                const coord = info.get('coord').vec2;
                const blockType = info.get('type').data;
                this.blocks[this.gridView.coordToIndex(coord)].addBlock(blockType);
            }
        }
    }

    generateBlock(coord: Vec2, blockType: string): BlockView {
        if (!this.gridView.validCoord(coord)) return null;
        const block = this.blocks[this.gridView.coordToIndex(coord)];
        block?.addBlock(blockType);
        return block;
    }

    getBlockType(coord: Vec2): string {
        if (!this.gridView.validCoord(coord)) return 'invalid';
        const block = this.blocks[this.gridView.coordToIndex(coord)];
        const blockType = block.blockType != null ? block.blockType : 'empty';
        return blockType;
    }

    matchBlock(target: string, match: string): boolean {
        if (match == null) return true;
        if (match == 'any') return target != 'empty' && target != 'invalid';
        return target == match;
    }

    matchRotation(rotation: number, neighbors: Map<number, string>, neighborCoords: Vec2[]): boolean {
        for (const pair of neighbors) {
            const index = pair[0];
            const match = pair[1];
            if (!this.matchBlock(this.getBlockType(neighborCoords[(index + rotation) % neighborCoords.length]), match)) {
                return false;
            }
        }
        return true;
    }

    matchPattern(coord: Vec2, pattern: BlockPattern): boolean {
        if (this.gridView.validCoord(coord)) {
            const blockType = this.getBlockType(coord);
            const neighborCoords = this.gridView.getNeighborCoords(coord, true);
            if (this.matchBlock(blockType, pattern.target)) {
                for(let i = 0; i < 4; i++) {
                    if (this.matchRotation(i * 2, pattern.neighbors, neighborCoords)) return true;
                }
            }
        }
        return false;
    }
}


