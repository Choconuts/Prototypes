import { _decorator, Component, Node, Sorting, Sorting2D, UITransform } from 'cc';
import { getOrAddComponent } from '../../toolkits/Functions';
const { ccclass, property } = _decorator;

@ccclass('AutoSortingLayer')
export class AutoSortingLayer extends Component {
    @property
    layer: number = 3

    protected start(): void {
        this.updateLayers();
    }

    updateLayers() {
        for (const ui of this.getComponentsInChildren(UITransform)) {
            const sorting = getOrAddComponent(ui, Sorting2D);
            sorting.sortingLayer = this.layer;
        }
    }
}


