import { _decorator, Component, Node, Rect } from 'cc';
import { Info, Stream } from '../toolkits/Functions';
import { Factory } from './Factory';
const { ccclass, property } = _decorator;

export enum ProxyEvent {
    COMMIT = 'event-commit',
    UPDATE = 'event-update',
    CANCEL = 'event-cancel',
}

@ccclass('Proxy')
export class Proxy extends Component {
    static Event = ProxyEvent

    @property(Node)
    target?: Node = null
    
    eventStream: Map<string, Stream<Info>> = new Map

    createProxy(target: Node, key: string) {
        const proxyNode = Factory.instance.get(key);
        if (proxyNode !== null) {
            const proxy = proxyNode.addComponent(Proxy);
            proxy.target = target;
            this.node.addChild(proxyNode);
            return proxy;
        }
        return null;
    }

    send(tag: string, info: Info = null) {
        if (!this.eventStream.has(tag)) {
            this.eventStream.set(tag, new Stream<Info>);
        }
        this.eventStream.get(tag).put(info);
    }

    async wait(tag: string): Promise<Info> {
        if (!this.eventStream.has(tag)) {
            this.eventStream.set(tag, new Stream<Info>);
        }
        return this.eventStream.get(tag).get();
    }

    close(): Proxy {
        this.node.destroy()
        return null;
    }
}


