function findTargetDistance(stateObj) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const enemyUnit = (stateObj.targetEnemyIndex !== null) ? stateObj.opponentArmy[stateObj.targetEnemyIndex] : stateObj.playerArmy[stateObj.targetAllyIndex]
    const distance = chebyshevDistance(selectedUnit.currentSquare, enemyUnit.currentSquare)
    return distance
}

function canBuffUnit(stateObj, index) {
    return stateObj.buffableSquares.includes(index);
}

function selectRandomWeapon(weapons) {
    const randomIndex = Math.floor(Math.random() * weapons.length);
    return weapons[randomIndex];
  }


async function executeEnemyAttack(stateObj, attacker, target, attack) {
    const targetIndex = stateObj.playerArmy.findIndex(unit => unit.currentSquare === target.currentSquare);

    stateObj = await attack.execute(stateObj, targetIndex, attack, attacker, false);
    return immer.produce(stateObj, draft => {
        
        if (targetIndex === -1) return;

        // Mark the attacker as having attacked this turn
        const attackerIndex = draft.opponentArmy.findIndex(unit => unit.id === attacker.id);
        if (attackerIndex !== -1) {
            draft.opponentArmy[attackerIndex].unitAttackedThisTurn = true;
        }
    });
}

async function applyDamage(stateObj, targetIndex, attack, attackerSquare, isPlayer) {
    return immer.produce(stateObj, draft => {
        const targetUnit = isPlayer ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        const attackerUnit = isPlayer ? draft.playerArmy.find(unit => unit.currentSquare === attackerSquare) : draft.opponentArmy.find(unit => unit.currentSquare === attackerSquare);
        console.log(attackerUnit.name + " deals " + attack.damage + " to " + targetUnit.name)
        targetUnit.health -= attack.damage;
    });
}

function resetUnit(unit) {
    const resetUnitObj = new unit.constructor(unit.playerOwned, unit.id, unit.color);
    return {
        ...resetUnitObj,
        currentSquare: unit.currentSquare // Keep the current position
    };
}


async function applyAOEdamage(stateObj, targetIndex, attack, isPlayer) {
    const targetArmy = isPlayer ? stateObj.opponentArmy : stateObj.playerArmy;
    if (targetIndex < 0 || targetIndex >= targetArmy.length) {
        console.error("Invalid target index in applyAOEdamage");
        return stateObj;
    }
    
    const centerSquare = targetArmy[targetIndex].currentSquare;
    if (centerSquare === undefined) {
        console.error("Target unit has no currentSquare");
        return stateObj;
    }
    let targetCells = []
    let avatars = []

    stateObj = immer.produce(stateObj, draft => {
        const affectedSquares = getSquaresInRadius(centerSquare, attack.radius, draft.gridSize);

       
        
        for (const square of affectedSquares) {
            if (draft.grid[square] !== 0) {
                let targetUnit = draft.playerArmy.find(unit => unit.currentSquare === square);
                let targetArmy = draft.playerArmy;
                
                if (!targetUnit) {
                    targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === square);
                    targetArmy = draft.opponentArmy;
                }
                
                if (targetUnit) {
                    const targetCell = document.querySelector(`.grid-cell:nth-child(${targetUnit.currentSquare + 1})`);
                    targetCells.push(targetCell)
                    const avatar = targetCell.querySelector('img');
                    if (avatar) {
                        avatar.classList.add('taking-damage');
                        targetCell.classList.add('flash')
                        avatars.push(avatar)
                    }

                    // Clean up
                    targetUnit.health -= attack.damage;
                    // You could add an animation here
                    // await animateAOEDamage(targetUnit, attack.damage);
                }
            }
        }
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    for (let i=0; i < targetCells.length; i++) {
        targetCells[i].classList.remove('flash')
        avatars[i].classList.remove('glow-red')
    }
    return stateObj
    
}

function resetUnitTurnStatus(units) {
    units.forEach(unit => {
        unit.unitMovedThisTurn = false;
        unit.unitAttackedThisTurn = false;
    });
}

function resetUnitsHealth(units) {
    units.forEach(unit => {
        unit.health = unit.maxHealth;
    });
}

//Need to modify attacks to FIGURE OUT WHAT HAPPENS IF THEY DON"T HIT
async function executeAttack(stateObj, attackIndex, targetIndex) {
    const attack = stateObj.playerArmy[stateObj.selectedUnitIndex].attacks[attackIndex];
    if (!attack) return stateObj;

    stateObj = immer.produce(stateObj, draft => {
        draft.playerArmy[draft.selectedUnitIndex].unitAttackedThisTurn = true;
    });

    const attacker = stateObj.playerArmy[stateObj.selectedUnitIndex]
    const attackerSquare = attacker.currentSquare;
    const targetSquare = (attack.buff) ? stateObj.playerArmy[targetIndex].currentSquare : stateObj.opponentArmy[targetIndex].currentSquare;

    // Determine if the attack hits
    let hit = true
    if (attack.accuracyModifier > 0) {
        const distance = chebyshevDistance(attackerSquare, targetSquare);
        const hitRoll = Math.random();
        const markBuff = stateObj.opponentArmy[targetIndex].mark * 0.1;
        const stunnedPenalty = stateObj.playerArmy[stateObj.selectedUnitIndex].accuracy * 0.1;
        const distanceModifier = ((distance - 1) * attack.accuracyModifier);
        const threshold = distanceModifier + stunnedPenalty - markBuff;
        console.log('needed to roll a ' + Math.round(threshold*100) + " and rolled a " + Math.round(hitRoll*100))
        hit = hitRoll > threshold;
    }
    
    // Animate the attack
    await animateAttack(attackerSquare, targetSquare, hit, stateObj.gridSize);

    if (hit || !(attack.accuracyModifier > 0)) {
        stateObj = await attack.execute(stateObj, targetIndex, attack, attacker, true);
    }

    return stateObj;
}

async function executeBuffAttack(stateObj, attackIndex, targetIndex) {
    
    const attack = stateObj.playerArmy[stateObj.selectedUnitIndex].attacks[attackIndex];
    if (!attack) return stateObj;

    stateObj = immer.produce(stateObj, draft => {
        draft.playerArmy[draft.selectedUnitIndex].unitAttackedThisTurn = true;
    });

    stateObj = await attack.execute(stateObj, targetIndex, attack);
    return stateObj
}

async function applyMark(stateObj, targetIndex, amount, isPlayer) {
    return immer.produce(stateObj, async draft => {
        const targetUnit = isPlayer ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        if (targetUnit) {
            targetUnit.mark += amount;
            // Here you can add an animation function
            // await animateMark(targetUnit, amount);
        }
    });
}

async function applyStun(stateObj, targetIndex, amount, isPlayer) {
    return immer.produce(stateObj, async draft => {
        console.log("applying stun ad isplayer is " + isPlayer + " and target index is " + targetIndex)
        const targetUnit = (isPlayer) ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        console.log("applying stun to " + targetUnit.name)
        if (targetUnit) {
            targetUnit.accuracy += amount;
        }
    });
}

function getBuffableSquares(unit, attack, draft) {
    const buffableSquares = [];
    const range = attack.range || 1; // Default to 1 if not specified

    for (let i = 0; i < draft.playerArmy.length; i++) {
        const allyUnit = draft.playerArmy[i];
        if (allyUnit.id !== unit.id) { // Don't include the unit itself
            const distance = chebyshevDistance(unit.currentSquare, allyUnit.currentSquare);
            if (distance <= range) {
                buffableSquares.push(allyUnit.currentSquare);
            }
        }
    }

    return buffableSquares;
}


function addUnitToArmy(stateObj, unit) {
    return immer.produce(stateObj, draft => {
        const newUnit = new unit.constructor(true, draft.currentUnitID++, "blue");
        draft.selectedArmy.push(newUnit);
        draft.startingArmy.push(newUnit);
        draft.selectedArmyPoints += unit.points;
    });
}

function removeUnitFromArmy(stateObj, unit) {
    console.log("removing unit")
    return immer.produce(stateObj, draft => {
        unitIndex = draft.selectedArmy.indexOf(unit)
        starterIndex = draft.startingArmy.indexOf(unit)
        draft.selectedArmyPoints -= unit.points;

        draft.selectedArmy.splice(unitIndex, 1);
        draft.startingArmy.splice(starterIndex, 1);
    });
}

function startGame(stateObj) {
    return immer.produce(stateObj, draft => {
        const playerLocations = getRandomNumbersInRange(0, 16, draft.selectedArmy.length)
        for (let i=0; i < draft.selectedArmy.length; i++) {
            draft.selectedArmy[i].currentSquare = playerLocations[i]
        }
        draft.playerArmy = draft.selectedArmy;
        draft.currentScreen = "normalScreen";
        updateGrid(draft);
    });
}



function getUnitActionSquares(unit, gridSize) {
    const movableSquares = new Set();
    const attackRangeSquares = new Set();
    const currentRow = Math.floor(unit.currentSquare / gridSize);
    const currentCol = unit.currentSquare % gridSize;

    getSquaresInRange(currentRow, currentCol, unit.movementSquares, gridSize, movableSquares);
    unit.attacks.forEach(attack => {
        if (!attack.buff) {
            getSquaresInRange(currentRow, currentCol, attack.range, gridSize, attackRangeSquares);
        }
    });

    return { 
        movableSquares: Array.from(movableSquares), 
        attackRangeSquares: Array.from(attackRangeSquares)
    };
}

function getSquaresInRange(currentRow, currentCol, range, gridSize, squaresSet) {
    for (let rowOffset = -range; rowOffset <= range; rowOffset++) {
        for (let colOffset = -range; colOffset <= range; colOffset++) {
            const newRow = currentRow + rowOffset;
            const newCol = currentCol + colOffset;

            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                if (distance <= range && distance > 0) {
                    squaresSet.add(newRow * gridSize + newCol);
                }
            }
        }
    }
}

function chebyshevDistance(square1, square2) {
    const x1 = square1 % state.gridSize, y1 = Math.floor(square1 / state.gridSize);
    const x2 = square2 % state.gridSize, y2 = Math.floor(square2 / state.gridSize);
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function getSquaresInRadius(centerIndex, radius, gridSize) {
    const squares = [];
    const centerX = centerIndex % gridSize;
    const centerY = Math.floor(centerIndex / gridSize);

    for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                squares.push(y * gridSize + x);
            }
        }
    }

    return squares;
}

function getPossibleMoves(draft, unit) {
    const possibleMoves = [];
    const currentX = unit.currentSquare % draft.gridSize;
    const currentY = Math.floor(unit.currentSquare / draft.gridSize);

    for (let dx = -unit.movementSquares; dx <= unit.movementSquares; dx++) {
        for (let dy = -unit.movementSquares; dy <= unit.movementSquares; dy++) {
            const newX = currentX + dx;
            const newY = currentY + dy;
            const newSquare = newY * draft.gridSize + newX;

            if (newX >= 0 && newX < draft.gridSize && newY >= 0 && newY < draft.gridSize && 
                draft.grid[newSquare] === 0) {
                possibleMoves.push(newSquare);
            }
        }
    }
    return possibleMoves;
}

function getBestAttack(enemy, target) {
    // Get all attacks that can kill the target
    const killingAttacks = enemy.attacks.filter(attack => attack.damage >= target.health);

    if (killingAttacks.length > 0) {
        // If multiple attacks can kill, choose the one with the highest accuracy modifier
        killingAttacks.sort((a, b) => a.accuracyModifier - b.accuracyModifier);
        return killingAttacks[0];
    }

    // If no attack can kill, return the attack with the highest damage (can alter based on properties)
    return enemy.attacks.reduce((best, current) => 
        current.damage > best.damage ? current : best
    , enemy.attacks[0]);
}

