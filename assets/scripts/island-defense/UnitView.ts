import { _decorator, clamp, Color, Component, Graphics, Node, settings, Sorting2D, UITransform, v3 } from 'cc';
import { Behavior } from '../behavior-tree/Behavior';
import { GameMap } from './GameMap';
import { ProgressView } from '../common-view/ProgressView';
import { getOrAddComponent, Info } from '../toolkits/Functions';
const { ccclass, property } = _decorator;

const sortingLayers = settings.querySettings("engine", "sortingLayers");
const default_layer = sortingLayers[0].value;
const map_layer = sortingLayers[1].value;
const unit_layer = sortingLayers[2].value;

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
    purify: number = 0
    @property
    health: number = 10

    @property
    unitKey: string = ''

    @property
    isAnimal: boolean = false
    @property
    isBuilding: boolean = false

    @property
    buildingInitHealth: number = 10

    @property
    isBuildingFinished: boolean = false

    @property([Sorting2D])
    sortingLayers: Array<Sorting2D>

    protected onLoad(): void {
        if (this.behavior == null) {
            this.behavior = this.getComponentInChildren(Behavior);
        }
    }

    protected start(): void {
        this.addSortingLayer();
    }

    addSortingLayer() {
        const transforms = this.getComponentsInChildren(UITransform);
        const layers = transforms.map((transform, index, array) => {
            const layer = getOrAddComponent(transform, Sorting2D);
            layer.sortingOrder = -this.node.worldPosition.y;
            layer.sortingLayer = unit_layer;
            return layer;
        });
        this.sortingLayers = layers;
    }

    updateSortingLayer() {
        this.sortingLayers.forEach((layer, index, array) => {
            layer.sortingOrder = -this.node.worldPosition.y;
            layer.sortingLayer = unit_layer;
        });
    }

    protected update(dt: number): void {
        this.updateSortingLayer();
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
        this.healthDisplay();
        if (this.health == 0) {
            this.dead();
        }
    }

    healthDisplay() {
        const healthBar = this.getComponentInChildren(ProgressView);
        if (healthBar != null) {
            healthBar.value = this.health / this.maxHealth;

            if (this.isBuilding) {
                if (this.health >= this.maxHealth) {
                    this.isBuildingFinished = true;
                }

                if (this.isBuildingFinished) {
                    healthBar.setColor(Color.GREEN);
                }
                else {
                    healthBar.setColor(Color.GRAY);
                }
            }
            else {
                if (this.health >= this.maxHealth || this.health <= 0) {
                    healthBar.node.active = false;
                }
                else {
                    healthBar.node.active = true;
                }
            }
        }
    }

    dead() {
        GameMap.instance.removeUnit(this);
    }

    spawn(unitKey: string, isAnimal: boolean, isBuilding: boolean) {
        this.health = this.maxHealth;
        this.unitKey = unitKey;
        this.isAnimal = isAnimal;
        this.isBuilding = isBuilding;

        if (this.isBuilding) {
            this.health = this.buildingInitHealth;
        }
    }
}


