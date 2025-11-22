import { _decorator, Component, Node, NodeEventType } from 'cc';
import { Proxy } from '../proxy-manager/Proxy';
import { GameManager } from '../proxy-manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Hover')
export class Hover extends Component {
    @property
    proxyKey: string = 'default-hover'
    @property
    proxy?: Proxy = null

    protected onLoad(): void {
        this.node.on(NodeEventType.MOUSE_ENTER, (event) => {
            this.hoverStart();
        });

        this.node.on(NodeEventType.MOUSE_LEAVE, (event) => {
            this.proxy?.send(Proxy.Event.CANCEL);
        });
    }

    createProxy(): Proxy {
        const proxy = GameManager.instance.rootProxy.createProxy(this.node, this.proxyKey);
        if (proxy !== null) {
            this.proxy = proxy;
        }
        return proxy;
    }

    protected onDisable(): void {
        this.proxy?.close();
    }

    hoverStart() {
        if (this.proxy === null) {
            this.createProxy();
        }
    }

    hoverEnd() {
        this.proxy = this.proxy?.close();
    }
}


