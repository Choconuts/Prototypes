import { _decorator, Canvas, Component, Node } from 'cc';
import { Database } from './Database';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Canvas)
    canvas: Canvas

    protected onLoad(): void {
        const ready = this.preloadAllDatabases();
    }

    public async preloadAllDatabases() {
        for (const database of this.getComponents(Database)) {
            await database.preload();
        }
    }
}


