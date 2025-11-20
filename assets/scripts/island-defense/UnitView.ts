import { _decorator, clamp, Component, Node, v3 } from 'cc';
import { Behavior } from '../behavior-tree/Behavior';
import { GameMap } from './GameMap';
import { ProgressView } from '../common-view/ProgressView';
const { ccclass, property } = _decorator;

@ccclass('UnitView')
export class UnitView extends Component {
    @property(Behavior)
    behavior: Behavior
    @property(Node)
    character: Node

    @property
    maxHealth: number = 10
    @property
    attack: number = 3

    @property
    health: number = 10

    @property
    unitKey: string = ''

    @property
    isAnimal: boolean = false

    protected onLoad(): void {
        if (this.behavior == null) {
            this.behavior = this.getComponentInChildren(Behavior);
        }
    }

    protected update(dt: number): void {
        this.behavior?.program(dt);
    }

    get orient(): number {
        return this.character.scale.x;
    }

    set orient(velocityX: number) {
        const orient = Math.sign(velocityX);
        if (orient != 0) {
            this.character.scale = v3(orient * Math.abs(this.character.scale.x), this.character.scale.y, this.character.scale.z);
        }
    }

    dealDamage(damage: number) {
        this.health -= damage;
        this.health = clamp(this.health, 0, this.maxHealth);

        const healthBar = this.getComponentInChildren(ProgressView);
        if (healthBar != null) {
            healthBar.value = this.health / this.maxHealth;
        }

        if (this.health == 0) {
            this.dead();
        }
    }

    dead() {
        GameMap.instance.removeUnit(this);
    }

    spawn(unitKey: string, isAnimal: boolean) {
        this.health = this.maxHealth;
        this.unitKey = unitKey;
        this.isAnimal = isAnimal;
        this.dealDamage(0);
    }
}


