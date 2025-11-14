import { _decorator, Component, director, instantiate, Node, NodePool, path, Prefab, resources } from 'cc';
import { Completer, Stream } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('Factory')
export class Factory extends Component {
    static declare instance: Factory

    @property([String])
    directories: Array<string> = []
    @property
    initPoolSize = 2
    @property
    verbose: boolean = false

    poolMap: Map<string, NodePool> = new Map
    prefabMap: Map<string, Prefab> = new Map
    preloadCompleter: Completer<number> = new Completer

    protected onLoad(): void {
        Factory.instance = this;
        this.loadDirectories(this.directories).then((n) => this.preloadCompleter.complete(n));
    }

    get(key: string): Node {
        if (!this.prefabMap.has(key)) {
            return null;
        }
        const pool = this.poolMap.get(key);
        const prefab = this.prefabMap.get(key);
        let node: Node = null;
        if (pool.size() > 0) {
            node = pool.get();
        }
        else {
            node = instantiate(prefab);
        }
        node.active = true;
        return node;
    }

    put(key: string, node: Node): void {
        if (!this.poolMap.has(key)) {
            node.destroy();
            return;
        }
        node.active = false;
        const pool = this.poolMap.get(key);
        pool.put(node);
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
        const completer = new Completer<Prefab[]>;
        const keys = new Stream<string>;
        this.log('loading directory:', 'resources/' + directory);
        resources.loadDir(directory, Prefab, 
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
            this.initPrefab(key, prefab, this.initPoolSize);
        }

        return prefabs.length;
    }

    public initPrefab(key: string, prefab: Prefab, initPoolSize: number): void {
        if (this.prefabMap.has(key)) {
            this.log('prefab', key, 'already exists!');
        }
        else {
            this.log('add prefab:', key);
        }

        this.poolMap.set(key, new NodePool());
        this.prefabMap.set(key, prefab);
        const initNodes: Array<Node> = [];

        for (let i = 0; i < initPoolSize; i++) {
            initNodes.push(this.get(key));
        }
        
        for (const node of initNodes) {
            this.put(key, node);
        }
    }

    log(...args: any) {
        if (this.verbose) {
            console.log('[Factory]', ...args);
        }
    }
}


