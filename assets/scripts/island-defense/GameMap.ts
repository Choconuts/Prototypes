import { _decorator, Color, Component, Graphics, Node, randomRangeInt, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { GridView } from '../common-view/GridView';
import { Factory } from '../proxy-manager/Factory';
import { GameManager } from '../proxy-manager/GameManager';
import { Library } from '../proxy-manager/Library';
import { Completer, createWidgetChild, Info } from '../toolkits/Functions';
import { SlotView } from '../common-view/SlotView';
import { RectView } from '../toolkits/RectView';
import { Hover } from '../common-modal/Hover';
import { BlockView } from './BlockView';
import { UnitView } from './UnitView';
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
    @property(GridView)
    gridView: GridView

    @property([BlockView])
    blocks: Array<BlockView> = []

    @property([UnitView])
    units: Array<UnitView> = []

    animalMap: Map<Vec2, UnitView> = new Map

    @property
    visualOpacity: number = 0.4
    baseInfo: Info

    lock: Completer<void> = new Completer

    protected onLoad(): void {
        GameMap.instance = this;
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);
            this.gridView.slots.forEach((slot, index, array) => {
                const block = Factory.instance.get(this.blockKey);
                slot.node.addChild(block);
                this.blocks.push(block.getComponent(BlockView));
                this.createSelectHover(slot);
            });
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
        this.lock.complete();
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

    matchTask(matchInfo?: Info): Map<Vec2, string> {
        if (matchInfo != null) {
            const matchTask: Map<Vec2, string> = new Map;
            for (let i = 0; i < matchInfo.arrayLength; i++) {
                const pattern = matchInfo.get(i.toString());
                const offset = pattern.get('offset')?.vec2;
                const blockType = pattern.get('type')?.data;
                if (offset != null && blockType != null) {
                    matchTask.set(offset, blockType);
                }
            }
            return matchTask;
        }
        return null;
    }

    matchRegion(slot: SlotView, matchTask: Map<Vec2, string>, rotation: number): boolean {
        for (const pair of matchTask) {
            let offset = pair[0];
            const blockType = pair[1];

            if (rotation == 1) {
                offset = v2(offset.y, -offset.x);
            }
            else if (rotation == 2) {
                offset = offset.clone().multiplyScalar(-1);
            }
            else if (rotation == 3) {
                offset = v2(-offset.y, offset.x);
            }
            else if (rotation == 4) {
                offset = v2(offset.y, offset.x);
            }
            else if (rotation == 5) {
                offset = v2(-offset.y, -offset.x);
            }

            if (!this.matchBlock(this.getBlockType(offset.clone().add(slot.coord)), blockType)) {
                return false;
            }
        }
        return true;
    }

    matchSlots(info: Info): Array<SlotView> {
        const allMatchInfo = info?.get('region');
        const matchSlots: Array<SlotView> = [];
        if (allMatchInfo != null) {
            for (let k = 0; k < allMatchInfo.arrayLength; k++) {
                const matchInfo = allMatchInfo.get(k.toString())?.get('match');
                const matchTask = this.matchTask(matchInfo);
                for (const slot of this.gridView.slots) {
                    for (let r = 0; r < 4; r++) {
                        if (this.matchRegion(slot, matchTask, r)) {
                            matchSlots.push(slot);
                            break;
                        }
                    }

                }
            }
        }

        return matchSlots;
    }

    putOnMap(node: Node, worldPosition: Vec3) {
        this.node.addChild(node);
        const transform = this.getComponent(UITransform);
        const relative = transform.convertToNodeSpaceAR(v3(worldPosition.x, worldPosition.y, 0));
        node.position = relative;
    }

    async generateCreature(info: Info, unitKey: string, isAnimal: boolean = true): Promise<UnitView> {
        await this.lock.promise;
        this.lock = new Completer;
        let matchSlots = this.matchSlots(info);

        if (isAnimal) {
            matchSlots = matchSlots.filter((slot, index, array) => {
                return !this.animalMap.has(slot.coord);
            });
        }

        if (matchSlots.length > 0) {
            const index = randomRangeInt(0, matchSlots.length);
            const slot = matchSlots[index];
            const node = Factory.instance.get(unitKey);
            const unit = node?.getComponent(UnitView);
            if (unit == null) {
                Factory.instance.put(unitKey, node);
                this.lock.complete();
                return null;
            }
            this.putOnMap(node, slot.node.worldPosition);
            this.units.push(unit);

            if (isAnimal) {
                this.animalMap.set(slot.coord, unit);
            }
            this.lock.complete();
            return unit;
        }
        this.lock.complete();
        return null;
    }
}


