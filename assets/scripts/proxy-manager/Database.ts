import { _decorator, Component, JsonAsset, Node, path, resources } from 'cc';
import { Completer, Stream } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('Database')
export class Database extends Component {
    static declare instance: Database

    @property([String])
    directories: Array<string> = []
    @property
    verbose: boolean = false

    preloadCompleter: Completer<number> = new Completer

    protected onLoad(): void {
        Database.instance = this;
        this.loadDirectories(this.directories).then((n) => this.preloadCompleter.complete(n));
    }

    public async loadDirectories(directories: string[]): Promise<number> {
        let total = 0;
        for (const directory of directories) {
            const num = await this.loadDirectory(directory);
            if (num > 0) {
                total += num;
            }
        }
        return total;
    }

    public async loadDirectory(directory: string): Promise<number> {
        const completer = new Completer<JsonAsset[]>;
        const keys = new Stream<string>;
        this.log('loading directory:', 'resources/' + directory);
        resources.loadDir(directory, JsonAsset, 
            (finished, total, item) => {
                const filePath = item.info['path'];
                keys.put(path.basename(filePath));
            }, 
            (err, data) => {
                if (err == null) {
                    completer.complete(data);
                }
                else {
                    console.error('[Factory]', directory, err);
                    completer.complete(null);
                }
            });

        const prefabs = await completer.promise;
        if (prefabs == null) return -1;

        for (const prefab of prefabs) {
            const key = await keys.get();
            // this.initPrefab(key, prefab, this.initPoolSize);
        }

        return prefabs.length;
    }

    log(...args: any) {
        if (this.verbose) {
            console.log('[Factory]', ...args);
        }
    }
}


