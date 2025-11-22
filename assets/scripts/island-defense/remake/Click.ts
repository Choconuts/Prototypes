import { _decorator, Component, Node, NodeEventType } from 'cc';
import { Proxy } from '../../proxy-manager/Proxy';
import { GameManager } from '../../proxy-manager/GameManager';
import { Completer } from '../../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('Click')
export class Click extends Component {
    @property
    proxyKey: string = 'default-click'
    @property
    proxy?: Proxy = null

    completer: Completer<void>

    protected onLoad(): void {
        this.node.on(NodeEventType.MOUSE_DOWN, (event) => {
            this.click();
        });

        this.node.on(NodeEventType.MOUSE_UP, (event) => {
            this.proxy?.send(Proxy.Event.CANCEL);
        });
    }

    createProxy(): Proxy {
        this.completer = new Completer;
        const proxy = GameManager.instance.rootProxy.createProxy(this.node, this.proxyKey);
        if (proxy != null) {
            this.proxy = proxy;
            this.completer.complete();
        }
        return proxy;
    }

    click() {
        if (this.proxy == null) {
            this.createProxy();
        }
    }

    close() {
        if (this.completer == null) {
            this.proxy = this.proxy?.close();
        }
        else {
            this.completer.promise.then(() => {
                this.proxy = this.proxy?.close();
            });
        }
    }
}


