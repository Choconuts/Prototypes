import { _decorator, Component, Node, Rect } from 'cc';
import { Stream } from '../toolkits/Functions';
import { Factory } from './Factory';
const { ccclass, property } = _decorator;

@ccclass('Proxy')
export class Proxy extends Component {
    @property(Node)
    parent?: Node = null
    
    eventStream: Map<string, Stream<Node>>

    createProxy(parent: Node, key: string) {
        const proxyNode = Factory.instance.get(key);
        if (proxyNode !== null) {
            const proxy = proxyNode.addComponent(Proxy);
            proxy.parent = parent;
            this.node.addChild(proxyNode);
            return proxy;
        }
        return null;
    }
}


