import { _decorator, Component, Input, input, Node, NodeEventType, UITransform, v3 } from 'cc';
import { Info } from '../toolkits/Functions';
import { Proxy } from '../proxy-manager/Proxy';
import { GameManager } from '../proxy-manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Drag')
export class Drag extends Component {
    @property
    proxyKey: string = 'default-drag'
    @property
    proxy?: Proxy = null

    protected onLoad(): void {
        this.node.on(NodeEventType.MOUSE_DOWN, () => {
            this.dragStart();
        });

        this.node.on(NodeEventType.MOUSE_UP, () => {
            this.proxy?.send(Proxy.Event.CANCEL);
        });

        input.on(Input.EventType.MOUSE_UP, () => {
            this.proxy?.send(Proxy.Event.CANCEL);
        });
    }

    dragStart() {
        if (this.proxy === null) {
            this.createProxy();
        }
    }

    dragEnd() {
        this.proxy = this.proxy?.close();
    }

    createProxy(): Proxy {
        const proxy = GameManager.instance.rootProxy.createProxy(this.node, this.proxyKey);
        if (proxy !== null) {
            this.proxy = proxy;
        }
        return proxy;
    }

    protected update(dt: number): void {
        if (this.proxy !== null) {
            const pos = input.getTouch(0)?.getUILocation();
            if (pos != null) {
                const transform = this.node.getComponent(UITransform);
                const relative = transform.convertToNodeSpaceAR(v3(pos.x, pos.y, 0));
                const absolute = v3(pos.x, pos.y, 0);
                const info = Info.Empty({"relative": relative, "absolute": absolute});
                this.proxy.send(Proxy.Event.UPDATE, info);
            }
            else {
                this.dragEnd();
            }
        }
    }
}


