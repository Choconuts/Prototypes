import { _decorator, Component, Node } from 'cc';
import { Behavior } from './Behavior';
const { ccclass, property } = _decorator;

@ccclass('DeriveBehavior')
export class DeriveBehavior extends Behavior {
    enterCondition(): boolean {
        return false;
    }
}


