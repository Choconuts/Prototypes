import { _decorator, Component, director, instantiate, Node, NodePool, path, Prefab, resources } from 'cc';
import { Completer, Stream } from '../toolkits/Functions';
import { Database } from './Database';
const { ccclass, property } = _decorator;

@ccclass('Factory')
export class Factory extends Database {
    static declare instance: Factory

    @property
    initPoolSize = 2

    poolMap: Map<string, NodePool> = new Map
    prefabMap: Map<string, Prefab> = new Map

    protected onLoad(): void {
        Factory.instance = this;
    }

    public async preload(): Promise<void> {
        const completer: Completer<void> = new Completer;
        this.loadDirectories(this.directories, Prefab).then((jsonMap) => {
            jsonMap.forEach((value, key, map) => {
                this.processData(key, value, this.initPoolSize);
            });
            completer.complete();
        });
        return completer.promise;
    }

    public processData(key: string, prefab: Prefab, initPoolSize: number): void {
        key = prefab.name;
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

    get(key: string): Node {
        console.log('ask', key);
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
        console.log('put', key, node.name);
        if (!this.poolMap.has(key)) {
            node.destroy();
            return;
        }
        node.active = false;
        const pool = this.poolMap.get(key);
        pool.put(node);
    }
}


