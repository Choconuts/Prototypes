import { _decorator, Color, Component, Constructor, Graphics, JsonAsset, Node, UITransform, v2, Vec2, Widget } from 'cc';
import { RectView } from './RectView';
const { ccclass, property } = _decorator;

export function getOrAddComponent<T extends Component>(target: Component | Node, classConstructor:Constructor<T>): T | null {
    let component = target.getComponent(classConstructor);
    if (component == null) {
        component = target.addComponent(classConstructor);
    }
    return component;
}

export function createWidgetChild(target: Component, name?: string, options?: {expandPadding?: number, centerOffset?: Vec2}): Widget {
    const node = new Node;
    if (name == null) {
        name = 'widget';
    }
    
    node.name = name;

    const expand = options?.expandPadding != null;
    const center = !expand && options?.centerOffset != null;

    const widget = getOrAddComponent(node, Widget);
    widget.isAlignTop = expand;
    widget.isAlignBottom = expand;
    widget.isAlignLeft = expand;
    widget.isAlignRight = expand;
    widget.isAlignHorizontalCenter = center;
    widget.isAlignVerticalCenter = center;

    if (expand) {
        widget.top = options?.expandPadding;
        widget.bottom = options?.expandPadding;
        widget.left = options?.expandPadding;
        widget.right = options?.expandPadding;
    }

    if (center) {
        widget.horizontalCenter = options?.centerOffset.x;
        widget.verticalCenter = options?.centerOffset.y;
    }

    target.node.addChild(node);
    return widget;
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
    keyPath: string[] = []
    data: any

    getValueByPath(obj: any, keys: string[], depth: number = -1) {
        keys.forEach((key, index, array) => {
            if (index < depth || depth < 0) {
                obj = this.getValue(obj, key);
            }
        });
        return obj;
    }

    get(key: string): Info {
        let newData = this.getValue(this.data, key);
        newData = this.unref(newData);
        if (newData == null) return null;
        const info = new Info;
        info.json = this.json;
        info.rootTable = this.rootTable;
        info.data = newData;
        info.keyPath = [...this.keyPath];
        info.keyPath.push(key);
        return info;
    }

    getValue(record: any, key: string): any {
        if (record == null) {
           return null;
        }
        let value: any = record[key];
        return value;
    }

    toKeyPath(refKeyString: string) {
        if (typeof refKeyString === 'string' && refKeyString.startsWith('@')) {
            const keys = refKeyString.split("@");
            keys.shift();
            return keys;
        }
        return null;
    }

    unref(value: any) {
        let result = undefined;
        const keyPath = this.toKeyPath(value);
        if (keyPath != null) {
            for (let i = this.keyPath.length - 1; i >= 0; i--) {
                const subTree = this.getValueByPath(this.rootTable, this.keyPath, i);
                const obj = this.getValueByPath(subTree, keyPath);
                if (obj != null) {
                    return obj;
                }
            }
        }
        return value;
    }

    static Empty(record: Record<string, any> = null): Info {
        const info = new Info;
        info.json = null;
        info.rootTable = record;
        info.data = record;
        return info;
    }

    get arrayLength(): number | null {
        return this.data?.length;
    }

    get vec2(): Vec2 {
        const x: number = this.get('0').data;
        const y: number = this.get('1').data;
        return v2(x, y);
    }

    get base(): Info {
        const info = new Info;
        info.json = this.json;
        info.rootTable = this.rootTable;
        info.data = this.rootTable;
        return info;
    }
}


export function createRectWidget(parent: Component, colorHex: string, name?: string, padding: number = 0, radius: number = 0): RectView {
    if (name == null) {
        name = 'rect';
    }
    const widget = createWidgetChild(parent, name, {expandPadding: padding});
    const graphics = widget.addComponent(Graphics);
    const rect = widget.addComponent(RectView);
    rect.radius = radius;
    graphics.fillColor = Color.fromHEX(new Color, colorHex);
    graphics.lineWidth = 3;
    return rect;
}

export function setRectColor(target: Component, colorHex: string) {
    const graphics = getOrAddComponent(target, Graphics);
    const rect = getOrAddComponent(target, RectView);
    graphics.fillColor = Color.fromHEX(new Color, colorHex);
    rect.draw();
}
