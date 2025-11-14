import { _decorator, Component, Constructor, JsonAsset, Node } from 'cc';
const { ccclass, property } = _decorator;

export function getOrAddComponent<T extends Component>(target: Component, classConstructor:Constructor<T>): T | null {
    let component = target.getComponent(classConstructor);
    if (component == null) {
        component = target.addComponent(classConstructor);
    }
    return component;
}

export class Completer<T> {
    promise: Promise<T>
    complete: (value: T | PromiseLike<T>) => void
    reject: (reason?: any) => void

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.complete = resolve;
            this.reject = reject;
        });
    }
}

export class Stream<T> {
    sink: Array<Completer<T>> = new Array
    source: Array<T> = new Array
    broadcast: boolean = false

    async get(): Promise<T> {
        if (this.source.length > 0) {
            return this.source.shift();
        }
        const completer = new Completer<T>;
        this.sink.push(completer);
        return completer.promise;
    }

    put(event: T) {
        if (this.sink.length > 0) {
            if (this.broadcast) {
                this.sink.forEach((completer, index, sink) => {
                    completer.complete(event);
                });
                this.sink.length = 0;
            }
            else {
                const completer = this.sink.shift();
                completer.complete(event);
            }
        }
        else {
            this.source.push(event);
        }
    }
}

export class Info {
    json: JsonAsset
    rootTable: Record<string, any>
    data: any
}

