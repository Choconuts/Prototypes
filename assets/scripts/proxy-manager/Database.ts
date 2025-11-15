import { _decorator, Asset, Component, Constructor, JsonAsset, Node, path, Prefab, resources } from 'cc';
import { Completer, Stream } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('Database')
export class Database extends Component {
    @property([String])
    directories: Array<string> = []
    @property
    verbose: boolean = false

    public async preload(): Promise<void> {
        this.log('preload')
    }

    public async loadDirectories<T extends Asset>(directories: string[], constructor: Constructor<T>): Promise<Map<string, T>> {
        const output: Map<string, T> = new Map;
        for (const directory of directories) {
            const result = await this.loadDirectory(directory, constructor);
            if (result != null) {
                result.forEach((value, key, map) => output.set(key, value));
            }
        }
        return output;
    }

    public async loadDirectory<T extends Asset>(directory: string, constructor: Constructor<T>): Promise<Map<string, T>> {
        const completer: Completer<T[]> = new Completer;
        const keys: Stream<string> = new Stream;
        const result: Map<string, T> = new Map;
        
        this.log('loading directory:', 'resources/' + directory);
        resources.loadDir(directory, constructor, 
            (finished, total, item) => {
                if (item?.info != null) {
                    const filePath = item.info['path'];
                    keys.put(path.basename(filePath));
                }
            }, 
            (err, data) => {
                if (err == null) {
                    completer.complete(data);
                }
                else {
                    this.error(directory, err)
                    completer.complete(null);
                }
            });

        const dataList = await completer.promise;
        if (dataList == null || dataList.length == 0) {
            this.log('directory:', 'resources/' + directory, 'is empty!');
            return null;
        }
        
        for (const data of dataList) {
            const key = await keys.get();
            result.set(key, data);
        }

        return result;
    }

    log(...args: any) {
        if (this.verbose) {
            console.log('[' + this.constructor.name + ']', ...args);
        }
    }

    error(...args: any) {
        if (this.verbose) {
            console.error('[' + this.constructor.name + ']', ...args);
        }
    }
}


