import { _decorator, Canvas, Component, Node } from 'cc';
import { Database } from './Database';
import { Proxy } from './Proxy';
import { getOrAddComponent } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    static declare instance: GameManager

    @property(Canvas)
    canvas: Canvas
    @property(Proxy)
    rootProxy: Proxy

    protected onLoad(): void {
        GameManager.instance = this;
        if (this.rootProxy == null) {
            this.rootProxy = getOrAddComponent(this, Proxy);
        }
        const ready = this.preloadAllDatabases();
    }

    public async preloadAllDatabases() {
        for (const database of this.getComponents(Database)) {
            await database.preload();
        }
    }
}


