
class BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color = "white", unitCurrentSquare = 0) {
        this.health = 5;
        this.maxHealth = 5;
        this.points = 2;
        this.name = "rifleman"
        this.leader = false;
        this.movementSquares = 2;
        this.playerOwned = isPlayerOwned;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.currentSquare = unitCurrentSquare;
        this.id = id;
        this.movement = "moveTowardsLeader";
        this.mark = 0;
        this.accuracy=0;
        this.img = 'img/rifleman.png';
        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 5,
                accuracyModifier: 0.15,
                damage: 2,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj;
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage. Medium accuracy. Long range"
                    return textString
                }
            },
            {
                name: "Aim Dart - 1",
                range: 6,
                accuracyModifier: 0.1,
                damage: 1,
                mark: 1,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyMark(stateObj, targetIndex, attack.mark, isPlayerOwned);
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage. Apply " + this.mark + ".  High accuracy. Long range"
                    return textString
                }
            },
        ];
    }
}

class Shotgunner extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Shotgunner"
        this.health = 4;
        this.maxHealth = 4;
        this.color = color;
        this.movementSquares = 2;
        this.points = 2;
        this.leader = false;
        this.movement = "towardsClosestEnemy";
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/shotgun.png';

        this.attacks = [
            {
                name: "Pistol Shot - 1",
                range: 4,
                accuracyModifier: 0.1,
                damage: 1,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Shotgun Blast - 4",
                range: 3,
                accuracyModifier: 0.25,
                damage: 4,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Low accuracy. Close range"
                    return textString
                }
            },
        ];
    }
}


//SUPPRESSIVE FIRE ATTACK
class minigunWarrior extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Minigunner"
        this.leader = false;
        this.health = 6;
        this.maxHealth = 6;
        this.color = color;
        this.movementSquares = 1;
        this.points = 3;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/minigun.png',

        this.attacks = [
            {
                name: "Aim Beacon",
                range: 6,
                damage: 0,
                mark: 1,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyMark(stateObj, targetIndex, attack.mark, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Apply " + this.mark + " mark.  Perfect accuracy. Long range"
                    return textString
                }
            },
            {
                name: "Minigun - 3",
                range: 5,
                accuracyModifier: 0.15,
                damage: 3,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Medium accuracy. Long range"
                    return textString
                }
            },
        ];
    }
}

class speederBike extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Speeder Bike"
        this.health = 7;
        this.maxHealth = 7;
        this.color = color;
        this.movementSquares = 3;
        this.points = 6;
        this.moveTowardsClosestEnemy = true;
        this.leader = false;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/bike.png',

        this.attacks = [
            {
                name: "Front Guns - 5",
                range: 4,
                accuracyModifier: 0.2,
                damage: 5,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Medium-low accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Splatter - 6",
                range: 1,
                accuracyModifier: 0.15,
                damage: 6,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  High accuracy. Must be adjacent"
                    return textString
                }
            },
        ];
    }
}

class stunner extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Scout"
        this.health = 4;
        this.maxHealth = 4;
        this.color = color;
        this.movementSquares = 3;
        this.leader = false;
        this.points = 2;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/scout.png',

        this.attacks = [
            {
                name: "Stun Dart",
                range: 4,
                stun: 1,
                accuracyModifier: 0.05,
                damage: 1,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyStun(stateObj, targetIndex, attack.stun, this.isPlayerOwned)
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage. Lower target accuracy by " + this.stun + ". Very High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Electric Claws",
                range: 1,
                accuracyModifier: 0.1,
                damage: 3,
                stun: 2,
                mark: 2,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyStun(stateObj, targetIndex, attack.stun, this.isPlayerOwned)
                    stateObj = await applyMark(stateObj, targetIndex, attack.mark, isPlayerOwned);
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage. Lower accuracy by " + this.stun + ".  Apply " + this.mark + " mark. Must be adjacent"
                    return textString
                }
            },
        ];
    }
}

class explosive extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Grenadier"
        this.health = 3;
        this.maxHealth = 3;
        this.color = color;
        this.leader = false;
        this.movementSquares = 2;
        this.points = 3;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/grenadier.png',

        this.attacks = [
            {
                name: "Frag Grenade",
                range: 4,
                radius: 2,
                damage: 2,
                explosive: true,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyAOEdamage(stateObj, targetIndex, attack, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage within " + this.radius + " squares. Perfect accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Dual Pistols - 2",
                range: 3,
                accuracyModifier: 0.1,
                damage: 2,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  High accuracy. Close range"
                    return textString
                }
                
            },
        ];
    }
}

//buffAttack.execute(stateObj, stateObj.targetAllyIndex, buffAttack);

class Lieutenant extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'Lieutenant';
        this.name = "Lieutenant"
        this.leader = true;
        this.health = 6;
        this.maxHealth = 6;
        this.color = color;
        this.movementSquares = 3;
        this.points = 4;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/lieutenant.png',

        this.attacks = [
            {
                name: "Inspire",
                range: 3,
                stun: -2,
                buff: true,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    console.log("buffing unit")
                    stateObj = await applyStun(stateObj, targetIndex, attack.stun, !isPlayerOwned)
                    return stateObj
                },
                text: function() {
                    let textString = "Raise ally accuracy by " + (-this.stun) + ".  Perfect accuracy. Close range"
                    return textString
                }
            },
            {
                name: "Huge Sword",
                range: 1,
                accuracyModifier: 0.1,
                damage: 4,
                buff: false,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Perfect accuracy. Must be adjacent"
                    return textString
                }
            },
        ];
    }
}

