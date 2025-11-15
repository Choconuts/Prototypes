import { _decorator, Asset, Component, Constructor, JsonAsset, Node } from 'cc';
import { Database } from './Database';
import { Completer, Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('Library')
export class Library extends Database {
    static declare instance: Library

    infoMap: Map<string, Info> = new Map

    protected onLoad(): void {
        Library.instance = this;
    }

    public async preload(): Promise<void> {
        const completer: Completer<void> = new Completer;
        this.loadDirectories(this.directories, JsonAsset).then((jsonMap) => {
            jsonMap.forEach((value, key, map) => {
                this.processData(key, value);
            });
            completer.complete();
        });
        return completer.promise;
    }

    public processData(key: string, asset: JsonAsset) {
        if (this.infoMap.has(key)) {
            this.log('info', key, 'already exists!');
        }
        else {
            this.log('add info:', key);
        }
        const info = new Info;
        info.json = asset;
        info.rootTable = asset.json;
        info.data = info.rootTable;
        this.infoMap.set(key, info);
    }
}


