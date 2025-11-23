import { _decorator, Component, Node, randomRange, Vec2 } from 'cc';
import { GridView } from '../../common-view/GridView';
import { GameManager } from '../../proxy-manager/GameManager';
import { ScheduleView } from './ScheduleView';
import { Factory } from '../../proxy-manager/Factory';
import { ProgressView } from '../../common-view/ProgressView';
import { GameMap } from '../GameMap';
import { SlotView } from '../../common-view/SlotView';
const { ccclass, property } = _decorator;

@ccclass('EnemyQueue')
export class EnemyQueue extends Component {
    @property(GridView)
    gridView: GridView
    @property
    scheduleKey: string = 'schedule-view'
    @property
    enemyKey = 'enemy-unit-remake'
    @property
    buildingKey = 'house-unit-remake'
    @property(ProgressView)
    progress: ProgressView
    @property
    periodInterval: number = 30
    @property
    currentTime: number = 0
    @property
    firstAgeLength: number = 3
    @property
    age: number = 0

    @property
    isWorking: boolean = false

    periods: Array<ScheduleView>

    protected onLoad(): void {
        GameManager.instance.gameReady.then(() => {
            this.periods = [];
            for (const slot of this.gridView.slots) {
                const schedule = Factory.instance.get(this.scheduleKey);
                this.periods.push(schedule.getComponent(ScheduleView));
                slot.node.addChild(schedule);
            }

            this.periods[0]?.setName('建设').setBlockType(null);
            this.periods[1]?.setName('侵略').setBlockType(null);
            this.progress.value = 0;
            this.waitMapLoad();
        });
    }

    async waitMapLoad() {
        this.age = 0;
        await GameMap.instance.lock!.promise;

        for (const pair of GameMap.instance.blockMap) {
            await pair[1].lock.promise;
        }

        const random = this.randomSchedule()[0];
        this.periods[1]?.setBlockType(random);
    }

    validateNeighborsForExplore(neighbors: Array<Vec2>) {
        for (const neighbor of neighbors) {
            const slot = GameMap.instance.coordToSlot(neighbor);

            if (!GameMap.instance.isBlock(slot)) {
                return true;
            }
            else {
                for (const enemy of GameMap.instance.getEnemies(slot)) {
                    if (enemy.isBuilding) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    validateSlotForBuild(slot: SlotView) {
        for (const enemy of GameMap.instance.getEnemies(slot)) {
            if (!enemy.isBuilding) {
                return true;
            }
        }
        return false;
    }

    async explore(blockTypes: Array<String>) {
        const blockSet = new Set(blockTypes);
        if (blockSet.size == 0) return;

        for (const pair of GameMap.instance.blockMap) {
            if (blockSet.has(pair[1].blockType)) {
                const coord = GameMap.instance.gridView.indexToCoord(pair[0]);
                const neighbors = GameMap.instance.neighbors(coord);

                if (this.validateNeighborsForExplore(neighbors)) {
                    GameMap.instance.generateUnit(coord, this.enemyKey, false, false);
                }
            }
        }
    }

    async build(blockTypes: Array<String>) {
        const blockSet = new Set(blockTypes);
        if (blockSet.size == 0) return;
        for (const pair of GameMap.instance.blockMap) {
            if (blockSet.has(pair[1].blockType)) {
                const coord = GameMap.instance.gridView.indexToCoord(pair[0]);

                if (this.validateSlotForBuild(GameMap.instance.coordToSlot(coord))) {
                    GameMap.instance.generateUnit(coord, this.buildingKey, false, true);
                }
            }
        }
    }

    randomMapSelection(blockCounts: Map<string, number>, totalCounts: number): string {
        let randomValue = randomRange(0, totalCounts);

        for (const pair of blockCounts) {
            randomValue -= pair[1];
            if (randomValue <= 0) {
                return pair[0];
            }
        }

        return null;
    }

    randomSchedule() {
        const blockCounts: Map<string, number> = new Map;
        const lastBlockTypes = new Set(this.periods.map((a) => a.blockTypes()).reduce((a, b) => a.concat(b)));

        let totalCounts = 0;

        for (const pair of GameMap.instance.blockMap) {
            const blockType = pair[1].blockType;
            if (!blockCounts.has(blockType)) {
                blockCounts.set(blockType, 0);
            }

            const value = lastBlockTypes.has(blockType) ? 0.01 : 1;
            blockCounts.set(blockType, blockCounts.get(blockType) + value);
            totalCounts += value;
        }

        const blockTypeA = this.randomMapSelection(blockCounts, totalCounts);
        totalCounts -= blockCounts[blockTypeA];
        blockCounts.delete(blockTypeA);

        const blockTypeB = this.randomMapSelection(blockCounts, totalCounts);
        return [blockTypeA, blockTypeB]
    }

    async next() {
        this.age += 1;
        const blocks = this.randomSchedule();
        if (this.age < this.firstAgeLength) {
            blocks[1] = null;
        }

        for (let i = 0; i < this.periods.length; i++) {
            const nextBlockTypes = i < this.periods.length - 1 ? [this.periods[i + 1].blockTypeA, this.periods[i + 1].blockTypeB] : blocks;
            this.periods[i].setBlockType(nextBlockTypes[0], nextBlockTypes[1]);
        }
    }

    async work() {
        for (let index = 0; index < this.periods.length; index++) {
            const schedule = this.periods[index];
            if (schedule.blockTypeA != null) {
                await schedule.highlight();
                if (index == 0) {
                    await this.build(schedule.blockTypes());
                }
                else if (index == 1) {
                    await this.explore(schedule.blockTypes());
                }
            }
        }

        await this.next();
    }

    async step(dt: number) {
        this.currentTime += dt;
        this.progress.value = this.currentTime / this.periodInterval;
        if (this.currentTime >= this.periodInterval) {
            this.isWorking = true;
            await this.work();
            this.currentTime = this.currentTime - this.periodInterval;
            this.isWorking = false;
        }
    }

    protected update(dt: number): void {
        if (!this.isWorking) {
            this.step(dt);
        }
    }
}


