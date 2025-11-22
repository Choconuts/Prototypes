import { _decorator, Component, Node } from 'cc';
import { GridView } from '../../common-view/GridView';
const { ccclass, property } = _decorator;

@ccclass('EnemyQueue')
export class EnemyQueue extends Component {
    @property(GridView)
    gridView: GridView

    protected onLoad(): void {
        
    }
}


