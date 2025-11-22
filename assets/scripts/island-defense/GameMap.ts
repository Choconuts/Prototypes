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
import { Unit } from './Unit';
import { DeepSea } from './remake/DeepSea';
import { Click } from './remake/Click';
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
    boatKey: string = 'boat-unit'
    @property(GridView)
    gridView: GridView

    @property
    clickBehavior: string = 'click-block'
    @property
    hoverBehavior: string = 'block-hover'

    @property([BlockView])
    blocks: Array<BlockView> = []

    @property([UnitView])
    units: Array<UnitView> = []

    animalMap: Map<number, UnitView> = new Map
    enemyArray: Array<UnitView> = new Array
    blockMap: Map<number, BlockView> = new Map

    @property
    visualOpacity: number = 0.4
    baseInfo: Info

    @property
    remake: boolean = false

    lock: Completer<void> = new Completer

    protected onLoad(): void {
        GameMap.instance = this;
        GameManager.instance.gameReady.then(() => {
            this.baseInfo = Library.instance.get(this.database);
            this.gridView.slots.forEach((slot, index, array) => {
                this.initSea(slot);
            });
            this.initLevelMap();
        });
    }

    createSelectHover(slot: SlotView) {
        const visual = createWidgetChild(slot, 'visual', { expandPadding: 0 });
        const graphics = visual.addComponent(Graphics);
        const color = Color.fromHEX(new Color, '#88FF88');
        graphics.fillColor = new Color(color.r, color.g, color.b, this.visualOpacity * 255);
        visual.addComponent(RectView);
        visual.node.active = false;
        slot.selectionMaskView = visual.node;
    }

    initSea(slot: SlotView) {
        const block = Factory.instance.get(this.blockKey);
        slot.node.addChild(block);
        this.blocks.push(block.getComponent(BlockView));

        if (!this.remake) {
            this.createSelectHover(slot);
        }
    }

    initBlock(coord: Vec2, blockType: string) {
        if (blockType == 'boat') {
            const boat = this.generateUnit(coord, this.boatKey, false, false);
        }
        else {
            this.generateBlock(coord, blockType);
        }
    }

    initLevelMap() {
        const mapInfo = this.baseInfo.get('level-config').get('map');
        for (let i = 0; i < mapInfo.arrayLength; i++) {
            const info = mapInfo.get(i.toString());
            if (info != null) {
                const coord = info.get('coord').vec2;
                const blockType = info.get('type').data;
                this.initBlock(coord, blockType);
            }
        }

        if (this.remake) {
            if (this.clickBehavior.length > 0 || this.hoverBehavior.length > 0) {
                this.gridView.slots.forEach((slot) => {
                    if (this.clickBehavior.length > 0) {
                        const click = slot.addComponent(Click);
                        click.proxyKey = this.clickBehavior;
                    }
                    if (this.hoverBehavior.length > 0) {
                        const hover = slot.addComponent(Hover);
                        hover.proxyKey = this.hoverBehavior;
                    }
                    else {
                        console.error('', this.hoverBehavior);
                    }
                });
            }

            const queue: Array<Vec2> = [];
            const depthArray: Array<number> = new Array(this.blocks.length);
            for (const pair of this.blockMap) {
                const coord = this.gridView.indexToCoord(pair[0]);
                const index = this.gridView.coordToIndex(coord);
                depthArray[index] = -1;
                queue.push(coord);
            }

            while (queue.length > 0) {
                const coord = queue.shift();
                const index = this.gridView.coordToIndex(coord);
                const depth = depthArray[index];

                const neighborCoords = this.gridView.getNeighborCoords(coord, false, false);
                neighborCoords.forEach((neighborCoord, index, array) => {
                    const neighborIndex = this.gridView.coordToIndex(neighborCoord);
                    const neighborDepthSea = this.blocks[neighborIndex].getComponent(DeepSea);
                    if (depthArray[neighborIndex] == null) {
                        depthArray[neighborIndex] = depth + 1;
                        neighborDepthSea.setDepth(depth + 1);
                        queue.push(neighborCoord);
                    }
                });
            }
        }

        this.lock.complete();
    }

    coordToSlot(coord: Vec2): SlotView {
        if (this.gridView.validCoord(coord)) {
            return this.gridView.slots[this.gridView.coordToIndex(coord)];
        }
        return null;
    }

    generateBlock(coord: Vec2, blockType: string): BlockView {
        if (!this.gridView.validCoord(coord)) return null;
        const block = this.blocks[this.gridView.coordToIndex(coord)];
        block?.addBlock(blockType);
        this.blockMap.set(this.gridView.coordToIndex(coord), block);
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
                for (let i = 0; i < 4; i++) {
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

    generateUnit(coord: Vec2, unitKey: string, isAnimal: boolean, isBuilding: boolean): UnitView {
        if (!this.gridView.validCoord(coord)) return;
        const slot = this.gridView.slots[this.gridView.coordToIndex(coord)]
        const node = Factory.instance.get(unitKey);
        const unit = node?.getComponent(UnitView);
        if (unit == null) {
            Factory.instance.put(unitKey, node);
            this.lock.complete();
            return null;
        }

        const initPosition = slot.node.worldPosition.clone();

        if (isAnimal) {
            initPosition.add3f(0, -20, 0);
        }
        else if (isBuilding) {
            initPosition.add3f(0, 20, 0);
        }

        this.putOnMap(node, initPosition);
        this.units.push(unit);

        if (isAnimal) {
            this.animalMap.set(this.gridView.coordToIndex(slot.coord), unit);
        }
        else {
            this.enemyArray.push(unit);
        }

        unit.spawn(unitKey, isAnimal, isBuilding);
        return unit;
    }

    async generateCreature(info: Info, unitKey: string, isAnimal: boolean, isBuilding: boolean = false): Promise<UnitView> {
        await this.lock.promise;
        this.lock = new Completer;
        let matchSlots = this.matchSlots(info);

        if (isAnimal) {
            matchSlots = matchSlots.filter((slot, index, array) => {
                return !this.hasAnimal(slot) && !this.hasEnemy(slot);
            });
        }
        else if (isBuilding) {
            matchSlots = matchSlots.filter((slot, index, array) => {
                const enemies = this.getEnemies(slot);
                if (!this.hasAnimal(slot) && enemies.length > 0) {
                    for (const enemy of enemies) {
                        if (enemy.isBuilding) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            });
        }

        if (matchSlots.length > 0) {
            const index = randomRangeInt(0, matchSlots.length);
            const slot = matchSlots[index];
            const unit = this.generateUnit(slot.coord, unitKey, isAnimal, isBuilding);
            unit.getComponent(Unit)?.apply(info);
            this.lock.complete();
            return unit;
        }
        this.lock.complete();
        return null;
    }

    worldToMapPosition(worldPosition: Vec3): Vec3 {
        const transform = GameMap.instance.getComponent(UITransform);
        const relative = transform.convertToNodeSpaceAR(v3(worldPosition.x, worldPosition.y, 0));
        return relative;
    }

    nearestBlocks(worldPosition: Vec3, exclude?: Set<SlotView>): Array<SlotView> {
        let minDist = Infinity;
        let minSlots: Array<SlotView> = [];

        for (const block of this.blockMap.values()) {
            const slot = block.node.parent.getComponent(SlotView);
            const dist = slot.node.worldPosition.clone().subtract(worldPosition).length();

            if (exclude != null) {
                if (exclude.has(slot)) {
                    continue;
                }
            }

            if (minDist == dist) {
                minSlots.push(slot);
            }
            else if (minDist > dist) {
                minDist = dist;
                minSlots = [slot];
            }
        }

        return minSlots;
    }

    neighborBlocks(worldPosition: Vec3, exclude?: Set<SlotView>): Array<SlotView> {
        let slots: Array<SlotView> = [];
        const coord = this.worldPositionToCoord(worldPosition);

        for (const neighborCoord of this.gridView.getNeighborCoords(coord, false, true)) {
            const neighborSlot = this.coordToSlot(neighborCoord);
            if (exclude != null) {
                if (exclude.has(neighborSlot)) {
                    continue;
                }
            }
            if (this.isBlock(neighborSlot)) {
                slots.push(neighborSlot);
            }
        }
        return slots;
    }

    nearestSeas(worldPosition: Vec3): Array<SlotView> {
        let minDist = Infinity;
        let minSlots: Array<SlotView> = [];

        for (const block of this.blockMap.values()) {
            const slot = block.node.parent.getComponent(SlotView);

            for (const neighborCoord of this.gridView.getNeighborCoords(slot.coord, false, true)) {
                const neighborSlot = this.coordToSlot(neighborCoord);
                if (this.isBlock(neighborSlot)) continue;
                const dist = neighborSlot.node.worldPosition.clone().subtract(worldPosition).length();
                if (minDist == dist) {
                    minSlots.push(neighborSlot);
                }
                else if (minDist > dist) {
                    minDist = dist;
                    minSlots = [neighborSlot];
                }
            }
        }
        return minSlots;
    }

    worldPositionToCoord(worldPosition: Vec3): Vec2 {
        if (this.gridView.slots.length < 4) return undefined;

        const startSlot = this.gridView.slots[0];
        const endSlot = this.gridView.slots[this.gridView.slots.length - 1];

        const diff = worldPosition.clone().subtract(startSlot.node.worldPosition).toVec2();
        const totalDiff = endSlot.node.worldPosition.clone().subtract(startSlot.node.worldPosition).toVec2();
        const diffNorm = diff.divide(totalDiff).multiply(this.gridView.gridNum.clone().subtract2f(1, 1));

        const idX = Math.round(diffNorm.x)
        const idY = Math.round(diffNorm.y);
        return v2(idX, idY);
    }

    isBlock(slot: SlotView): boolean {
        return this.blockMap.has(this.gridView.coordToIndex(slot.coord));
    }

    hasAnimal(slot: SlotView): boolean {
        return this.animalMap.has(this.gridView.coordToIndex(slot.coord));
    }

    hasEnemy(slot: SlotView): boolean {
        return this.getEnemies(slot).length > 0;
    }

    getAnimals(slot: SlotView): Array<UnitView> {
        const animal = this.animalMap.get(this.gridView.coordToIndex(slot.coord));
        if (animal == null) return [];
        return [animal];
    }

    getEnemies(slot: SlotView): Array<UnitView> {
        const result = this.enemyArray.filter((enemy, index, array) => {
            return this.worldPositionToCoord(enemy.node.worldPosition).equals(slot.coord);
        });
        return result;
    }

    getBuilding(slot: SlotView): Array<UnitView> {
        const enemies = this.getEnemies(slot);
        return enemies.filter((unit, index, array) => unit.isBuilding);
    }

    findAnimalIndex(unit: UnitView) {
        for (const pair of this.animalMap) {
            if (pair[1] == unit) {
                return pair[0];
            }
        }
        return null;
    }

    removeUnit(unit: UnitView) {
        if (unit.isAnimal) {
            const idx = this.findAnimalIndex(unit);
            this.animalMap.delete(idx);
        }
        else {
            this.enemyArray = this.enemyArray.filter((enemy, index, array) => {
                return enemy != unit;
            });
        }
        unit.node.removeFromParent();
        Factory.instance.put(unit.unitKey, unit.node);
    }

    getIncompleteBuilding(slot: SlotView) {
        const buildings = this.getBuilding(slot);
        return buildings.filter((unit, index, array) => !unit.isBuildingFinished);
    }
}


