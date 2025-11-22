import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
import { Database } from './Database';
import { Completer } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('ArtData')
export class ArtData extends Database {
    static declare instance: ArtData

    spriteMap: Map<string, SpriteFrame> = new Map

    protected onLoad(): void {
        ArtData.instance = this;
    }

    public async preload(): Promise<void> {
        const completer: Completer<void> = new Completer;
        this.loadDirectories(this.directories, SpriteFrame).then((sprite) => {
            sprite.forEach((value, key, map) => {
                this.processData(key, value);
            });
            completer.complete();
        });
        return completer.promise;
    }

    public processData(key: string, asset: SpriteFrame) {
        if (this.spriteMap.has(key)) {
            this.log('sprite', key, 'already exists!');
        }
        else {
            this.log('add sprite:', asset.name);
        }
        this.spriteMap.set(asset.name, asset);
    }

    public get(key: string): SpriteFrame {
        return this.spriteMap.get(key);
    }
}


