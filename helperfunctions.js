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
        updateGridCSS(10)
        const playerLocations = getRandomNumbersInRange(0, stateObj.gridSize*2, draft.selectedArmy.length)
        for (let i=0; i < draft.selectedArmy.length; i++) {
            draft.selectedArmy[i].currentSquare = playerLocations[i]
        }
        draft.playerArmy = draft.selectedArmy;
        draft.permanentPlayerArmy = draft.selectedArmy
        draft.currentScreen = "normalScreen";
        updateGrid(draft);
    });
}



function getUnitActionSquares(unit, gridSize) {
    const movableSquares = new Set();
    const attackRangeSquares = new Set();
    const currentRow = Math.floor(unit.currentSquare / gridSize);
    const currentCol = unit.currentSquare % gridSize;

    if (!unit.unitMovedThisTurn) {
        getSquaresInRange(currentRow, currentCol, unit.movementSquares, gridSize, movableSquares);
    }

    if (!unit.unitAttackedThisTurn) {
        unit.attacks.forEach(attack => {
            if (!attack.buff) {
                getSquaresInRange(currentRow, currentCol, attack.range, gridSize, attackRangeSquares);
            }
        });
    }
    
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

async function pushBackwards(stateObj, targetIndex, squares, attackerSquare, isPlayer) {
    console.log("pushing backwards " + squares)
    return immer.produce(stateObj, draft => {
        const targetUnit = isPlayer ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        const targetSquare = targetUnit.currentSquare;
        
        // Calculate current positions and deltas
        const targetRow = Math.floor(targetSquare / draft.gridSize);
        const targetCol = targetSquare % draft.gridSize;
        const attackerRow = Math.floor(attackerSquare / draft.gridSize);
        const attackerCol = attackerSquare % draft.gridSize;
        
        const rowDiff = Math.abs(targetRow - attackerRow);
        const colDiff = Math.abs(targetCol - attackerCol);
        
        // Calculate push direction based on relative distances
        let newRow = targetRow;
        let newCol = targetCol;
        
        // If the vertical distance is significantly larger, push vertically
        if (rowDiff > colDiff * 2) {
            const pushDirection = targetRow > attackerRow ? 1 : -1;
            newRow = targetRow + (pushDirection * squares);
        }
        // If the horizontal distance is significantly larger, push horizontally
        else if (colDiff > rowDiff * 2) {
            const pushDirection = targetCol > attackerCol ? 1 : -1;
            newCol = targetCol + (pushDirection * squares);
        }
        // If distances are similar, push diagonally
        else {
            const rowDirection = targetRow > attackerRow ? 1 : -1;
            const colDirection = targetCol > attackerCol ? 1 : -1;
            newRow = targetRow + (rowDirection * squares);
            newCol = targetCol + (colDirection * squares);
        }

        // Ensure new position is within grid bounds
        newRow = Math.max(0, Math.min(draft.gridSize - 1, newRow));
        newCol = Math.max(0, Math.min(draft.gridSize - 1, newCol));
        
        // Calculate new square index
        const newSquare = (newRow * draft.gridSize) + newCol;
        
        console.log("old index was " + targetUnit.currentSquare + " and new index is " + newSquare)
        // Only move if the new square is empty
        if (draft.grid[newSquare] === 0) {
            draft.grid[targetSquare] = 0;
            targetUnit.currentSquare = newSquare;
            draft.grid[newSquare] = targetUnit;
        }
    });
}

async function pullCloser(stateObj, targetIndex, squares, attackerSquare, isPlayer) {
    console.log("pulling closer by " + squares + " squares");
    return immer.produce(stateObj, draft => {
        const targetUnit = isPlayer ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        const targetSquare = targetUnit.currentSquare;
        
        // Calculate current positions
        const targetRow = Math.floor(targetSquare / draft.gridSize);
        const targetCol = targetSquare % draft.gridSize;
        const attackerRow = Math.floor(attackerSquare / draft.gridSize);
        const attackerCol = attackerSquare % draft.gridSize;
        
        const rowDiff = targetRow - attackerRow;
        const colDiff = targetCol - attackerCol;
        
        // Determine movement direction
        let rowDirection = 0;
        let colDirection = 0;
        
        // If the vertical distance is significantly larger, pull vertically
        if (Math.abs(rowDiff) > Math.abs(colDiff) * 2) {
            rowDirection = rowDiff > 0 ? -1 : 1; // Move toward attacker
        }
        // If the horizontal distance is significantly larger, pull horizontally
        else if (Math.abs(colDiff) > Math.abs(rowDiff) * 2) {
            colDirection = colDiff > 0 ? -1 : 1; // Move toward attacker
        }
        // If distances are similar, pull diagonally
        else {
            rowDirection = rowDiff > 0 ? -1 : 1; // Move toward attacker row
            colDirection = colDiff > 0 ? -1 : 1; // Move toward attacker column
        }
        
        // Check along the path square by square and stop at first obstacle
        let finalRow = targetRow;
        let finalCol = targetCol;
        let obstacleFound = false;
        
        for (let step = 1; step <= squares; step++) {
            const checkRow = targetRow + (rowDirection * step);
            const checkCol = targetCol + (colDirection * step);
            
            // Check if in bounds
            if (checkRow < 0 || checkRow >= draft.gridSize || 
                checkCol < 0 || checkCol >= draft.gridSize) {
                break; // Hit boundary
            }
            
            const checkSquare = (checkRow * draft.gridSize) + checkCol;
            
            // Stop if we reach the attacker's square
            if (checkSquare === attackerSquare) {
                // If this is the first step, we are adjacent, so don't move
                if (step === 1) {
                    console.log("Already adjacent to attacker, no movement needed");
                    return;
                }
                
                // Otherwise use the previous valid position
                finalRow = targetRow + (rowDirection * (step - 1));
                finalCol = targetCol + (colDirection * (step - 1));
                obstacleFound = true;
                break;
            }
            
            // Check if the square is occupied
            if (draft.grid[checkSquare] !== 0) {
                // If we hit an obstacle on the first step, we can't move
                if (step === 1) {
                    console.log("Blocked by obstacle at first step, no movement possible");
                    return;
                }
                
                // Otherwise use the previous valid position
                finalRow = targetRow + (rowDirection * (step - 1));
                finalCol = targetCol + (colDirection * (step - 1));
                obstacleFound = true;
                break;
            }
            
            // This square is valid, update final position
            finalRow = checkRow;
            finalCol = checkCol;
        }
        
        // If we didn't find an obstacle, use the maximum calculated position
        if (!obstacleFound && squares > 0) {
            // Make sure final position is within bounds (redundant but safe)
            finalRow = Math.max(0, Math.min(draft.gridSize - 1, finalRow));
            finalCol = Math.max(0, Math.min(draft.gridSize - 1, finalCol));
        }
        
        // Calculate final square index
        const finalSquare = (finalRow * draft.gridSize) + finalCol;
        
        // Only move if the final position is different and empty
        if (finalSquare !== targetSquare && draft.grid[finalSquare] === 0) {
            console.log("Moving from " + targetSquare + " to " + finalSquare);
            draft.grid[targetSquare] = 0;
            targetUnit.currentSquare = finalSquare;
            draft.grid[finalSquare] = targetUnit;
        } else {
            console.log("No movement possible or already at destination");
        }
    });
}

async function applyAOEDamage(stateObj, targetIndex, attack, isPlayer, aoeRange) {
    console.log(`Applying AOE damage with range ${aoeRange} centered on square ${targetIndex}`);
    
    // Step 1: First animate the effect
    await animateAOEAttack(targetIndex, aoeRange, stateObj.gridSize);
    
    // Step 2: Calculate affected squares
    return immer.produce(stateObj, draft => {
        const targetRow = Math.floor(targetIndex / draft.gridSize);
        const targetCol = targetIndex % draft.gridSize;
        const affectedSquares = [];
        
        // Find all squares within AOE range of the target
        for (let rowOffset = -aoeRange; rowOffset <= aoeRange; rowOffset++) {
            for (let colOffset = -aoeRange; colOffset <= aoeRange; colOffset++) {
                const newRow = targetRow + rowOffset;
                const newCol = targetCol + colOffset;
                
                // Check if square is within grid boundaries
                if (newRow >= 0 && newRow < draft.gridSize && newCol >= 0 && newCol < draft.gridSize) {
                    const squareIndex = newRow * draft.gridSize + newCol;
                    
                    // Calculate Chebyshev distance (allows diagonal movement)
                    const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                    
                    // Only include squares within the specified range
                    if (distance <= aoeRange) {
                        affectedSquares.push(squareIndex);
                    }
                }
            }
        }
        
        console.log(`Affected squares: ${affectedSquares.join(', ')}`);
        
        // Step 3: Apply damage to player units in affected squares
        for (let i = 0; i < draft.playerArmy.length; i++) {
            const unit = draft.playerArmy[i];
            if (affectedSquares.includes(unit.currentSquare)) {
                console.log(`Player unit ${unit.name} at square ${unit.currentSquare} takes ${attack.damage} damage`);
                unit.health -= attack.damage;
            }
        }
        
        // Step 4: Apply damage to enemy units in affected squares
        for (let i = 0; i < draft.opponentArmy.length; i++) {
            const unit = draft.opponentArmy[i];
            if (affectedSquares.includes(unit.currentSquare)) {
                console.log(`Enemy unit ${unit.name} at square ${unit.currentSquare} takes ${attack.damage} damage`);
                unit.health -= attack.damage;
            }
        }
    });
}
async function animateAOEAttack(targetSquare, aoeRange, gridSize) {
    console.log(`Animating AOE attack on square ${targetSquare} with range ${aoeRange}`);
    
    const targetRow = Math.floor(targetSquare / gridSize);
    const targetCol = targetSquare % gridSize;
    let targetCells = [];
    let avatars = [];
    
    // Find all affected cells
    const cells = document.querySelectorAll('.grid-cell');
    if (!cells || cells.length === 0) {
        console.error('No grid cells found for animation');
        return;
    }
    
    // Find the target cell for the explosion center
    const targetCell = cells[targetSquare];
    if (!targetCell) {
        console.error(`Target cell at index ${targetSquare} not found`);
        return;
    }
    
    // Create explosion effect
    const explosionDiv = document.createElement('div');
    explosionDiv.className = 'explosion-effect';
    targetCell.appendChild(explosionDiv);
    
    // Add flash effect to all cells in range
    for (let rowOffset = -aoeRange; rowOffset <= aoeRange; rowOffset++) {
        for (let colOffset = -aoeRange; colOffset <= aoeRange; colOffset++) {
            const newRow = targetRow + rowOffset;
            const newCol = targetCol + colOffset;
            
            // Check if square is within grid boundaries
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                const squareIndex = newRow * gridSize + newCol;
                
                // Calculate Chebyshev distance (allows diagonal movement)
                const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                
                // Only include squares within the specified range
                if (distance <= aoeRange && squareIndex < cells.length) {
                    const cellToAnimate = cells[squareIndex];
                    if (cellToAnimate) {
                        cellToAnimate.classList.add('aoe-damage-effect');
                        targetCells.push(cellToAnimate);
                        
                        // Add shake animation to unit avatars
                        const avatar = cellToAnimate.querySelector('img');
                        if (avatar) {
                            avatar.classList.add('taking-aoe-damage');
                            avatars.push(avatar);
                        }
                    }
                }
            }
        }
    }
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Clean up all animation effects
    explosionDiv.remove();
    
    for (let i = 0; i < targetCells.length; i++) {
        targetCells[i].classList.remove('aoe-damage-effect');
    }
    
    for (let i = 0; i < avatars.length; i++) {
        avatars[i].classList.remove('taking-aoe-damage');
    }
}


