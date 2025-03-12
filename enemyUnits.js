class basicChargeEnemy {
    constructor(isPlayerOwned = true, id = 0, color = "white", unitCurrentSquare = 0) {
        this.health = 3;
        this.maxHealth = 3;
        this.points = 3;
        this.name = "Goblin"
        this.leader = false;
        this.movementSquares = 3;
        this.playerOwned = isPlayerOwned;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.currentSquare = unitCurrentSquare;
        this.id = id;
        this.movement = "towardsClosestEnemy";
        this.mark = 0;
        this.accuracy=0;
        this.img = 'img/goblin.png';
        this.attacks = [
            {
                name: "Sword Swipe ",
                range: 1,
                accuracyModifier: 0.05,
                damage: 2,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj;
                },
                text: function() {
                    return textString
                }
            },
        ];
    }
}

class basicShieldEnemy {
    constructor(isPlayerOwned = true, id = 0, color = "white", unitCurrentSquare = 0) {
        this.health = 4;
        this.maxHealth = 4;
        this.points = 3;
        this.name = "Porcupine"
        this.leader = false;
        this.movementSquares = 2;
        this.playerOwned = isPlayerOwned;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.currentSquare = unitCurrentSquare;
        this.id = id;
        this.movement = "towardsClosestEnemy";
        this.mark = 0;
        this.accuracy=0;
        this.img = 'img/porc1.png';
        this.attacks = [
            {
                name: "Stab",
                range: 2,
                accuracyModifier: 0.1,
                damage: 1,
                execute: async (stateObj, targetIndex, attack, attackingUnit, isPlayerOwned) => {
                    stateObj = await applyDamage(stateObj, targetIndex, attack, attackingUnit.currentSquare, isPlayerOwned);
                    return stateObj;
                },
                text: function() {
                    return textString
                }
            },
        ];
    }
}