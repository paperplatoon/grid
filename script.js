//Need a way to merge cards together - automatically on the board? after a round?
//start with a worse deck lol
//add a way to add cards after each combat

// Define the state object
const state = {
    // Turn
    currentTurn: 1,

    // Cards
    gameGrid: new Array(16).fill(0), // 4x4 grid initialized with zeros
    permanentDeck: [], 
    currentDeck: [],
    currentHand: [],
    status: 'grid',
    selectedCardIndex: null,

    // Enemy
    enemies: [
    { maxHealth: 40, currentHealth: 40, turnsTilAttack: 5 }, // Column 0
    null,                                                    // Column 1 has no enemy
    { maxHealth: 50, currentHealth: 50, turnsTilAttack: 6 }, // Column 2
    null                                                     // Column 3 has no enemy
    ],
};

// Sample card objects with different colors and attack properties
const cardSamples = [
    {
        color: 'red',
        attack: 1,
        scoringFunctions: [redBoost],
        endOfTurnFunctions: []
    },
    {
        color: 'blue',
        attack: 2,
        scoringFunctions: [blueTopRowBoost],
        endOfTurnFunctions: []
    },
    {
        color: 'green',
        attack: 3,
        scoringFunctions: [],
        endOfTurnFunctions: [greenGrow]
    },
    {
        color: 'yellow',
        attack: 1,
        scoringFunctions: [yellowRowBoost],
        endOfTurnFunctions: []
    },
    {
        color: 'purple',
        attack: 2,
        scoringFunctions: [],
        endOfTurnFunctions: [purpleBoostAdjacent]
    }
];


function createCardInstance(cardTemplate) {
    return {
        type: 'card',
        template: cardTemplate,
        color: Array.isArray(cardTemplate.color) ? [...cardTemplate.color] : [cardTemplate.color],
        attack: cardTemplate.attack,
        scoringFunctions: cardTemplate.scoringFunctions ? [...cardTemplate.scoringFunctions] : [],
        endOfTurnFunctions: cardTemplate.endOfTurnFunctions ? [...cardTemplate.endOfTurnFunctions] : []
    };
}

function initializeEnemies() {
    state.enemies = state.enemies.map(enemy => {
        if (enemy) {
            return { ...enemy, position: -1 };
        }
        return null;
    });
}

// Function to create a sample deck with 16 randomly chosen cards
function initializePermanentDeck() {
    const deck = [];
    // For example, give the player a starting deck of 20 cards
    for (let i = 0; i < 20; i++) {
        const randomCardTemplate = cardSamples[Math.floor(Math.random() * cardSamples.length)];
        const cardInstance = createCardInstance(randomCardTemplate);
        deck.push(cardInstance);
    }
    state.permanentDeck = deck;
}

function createCurrentDeck() {
    state.currentDeck = state.permanentDeck.map(cardInstance => ({
        type: 'card',
        template: cardInstance.template,
        color: [...cardInstance.color],
        attack: cardInstance.attack,
        scoringFunctions: [...cardInstance.scoringFunctions],
        endOfTurnFunctions: [...cardInstance.endOfTurnFunctions]
    }));
}

// Function to draw a card from the deck to the hand
function drawACard() {
    if (state.currentDeck.length > 0) {
        const drawnCard = state.currentDeck.shift(); // Remove the first card from the deck
        state.currentHand.push(drawnCard);
    } else {
        console.log("Deck is empty!");
    }
}

// Function to draw hand
function drawHand() {
    let cardsDrawn = 0;
    while (cardsDrawn < 4 && state.currentHand.length < 8) {
        drawACard();
        cardsDrawn++;
    }
}

// Scoring functions
function redBoost(cardIndex) {
    const gridCards = state.gameGrid;
    let redCardsCount = 0;
    for (let i = 0; i < gridCards.length; i++) {
        if (
            i !== cardIndex &&
            gridCards[i] !== 0 &&
            gridCards[i].color.includes('red')
        ) {
            redCardsCount++;
        }
    }
    return redCardsCount;
}

function blueTopRowBoost(cardIndex) {
    // Indices 0 to 3 represent the top row
    if (cardIndex >= 0 && cardIndex <= 3) {
        return 3;
    } else {
        return 0;
    }
}

function yellowRowBoost(cardIndex) {
    const rowIndex = Math.floor(cardIndex / 4); // Grid is 4x4
    let boost = 0;
    for (let i = 0; i < 4; i++) {
        const index = rowIndex * 4 + i;
        if (
            index !== cardIndex &&
            state.gameGrid[index] !== 0 &&
            state.gameGrid[index].color.includes('yellow')
        ) {
            boost += 4;
        }
    }
    return boost;
}

// End-of-turn function
function greenGrow(cardIndex) {
    if (state.gameGrid[cardIndex]) {
        state.gameGrid[cardIndex].attack += 1; // Increase attack by 1
    }
}

function purpleBoostAdjacent(cardIndex) {
    const gridWidth = 4; // 4x4 grid
    const leftIndex = cardIndex % gridWidth !== 0 ? cardIndex - 1 : null;
    const rightIndex = (cardIndex + 1) % gridWidth !== 0 ? cardIndex + 1 : null;

    if (leftIndex !== null && state.gameGrid[leftIndex] !== 0) {
        state.gameGrid[leftIndex].attack += 1;
    }

    if (rightIndex !== null && state.gameGrid[rightIndex] !== 0) {
        state.gameGrid[rightIndex].attack += 1;
    }
}



// Function to calculate total attack
function calculateDamagePerColumn() {
    const damagePerColumn = [0, 0, 0, 0];
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            const index = row * 4 + col;
            const card = state.gameGrid[index];
            if (card && card.type === 'card') {
                let cardAttack = card.attack;
                if (Array.isArray(card.scoringFunctions)) {
                    for (let func of card.scoringFunctions) {
                        cardAttack += func(index);
                    }
                }
                damagePerColumn[col] += cardAttack;
            }
        }
    }
    return damagePerColumn;
}

function handleEndOfTurnEffects() {
    state.gameGrid.forEach((card, index) => {
        if (card && card.type === 'card' && Array.isArray(card.endOfTurnFunctions)) {
            for (let func of card.endOfTurnFunctions) {
                func(index);
            }
        }
    });

    handleCardMerging();
}

function handleEnemyActions() {
    for (let col = 0; col < 4; col++) {
        const enemy = state.enemies[col];
        if (enemy) {
            // Decrement turnsTilAttack
            enemy.turnsTilAttack -= 1;

            if (enemy.turnsTilAttack <= 0) {
                const nextRow = enemy.position + 1;

                if (nextRow < 4) {
                    const index = nextRow * 4 + col;
                    const target = state.gameGrid[index];

                    if (target === 0) {
                        // Move enemy down
                        if (enemy.position >= 0) {
                            state.gameGrid[enemy.position * 4 + col] = 0; // Clear current position
                        }
                        enemy.position = nextRow;
                        state.gameGrid[index] = enemy;
                        enemy.turnsTilAttack = enemy.initialTurnsTilAttack || enemy.turnsTilAttack; // Reset turnsTilAttack if needed
                    } else if (target.type === 'card') {
                        // Kill the player card
                        removeCardFromGrid(index);

                        // Remove the card from the player's permanent deck
                        const cardIndex = state.permanentDeck.indexOf(target);
                        if (cardIndex !== -1) {
                            state.permanentDeck.splice(cardIndex, 1);
                        }

                        // Replace with enemy
                        if (enemy.position >= 0) {
                            state.gameGrid[enemy.position * 4 + col] = 0; // Clear current position
                        }
                        enemy.position = nextRow;
                        state.gameGrid[index] = enemy;
                        enemy.turnsTilAttack = enemy.initialTurnsTilAttack || enemy.turnsTilAttack; // Reset turnsTilAttack if needed
                    }
                } else {
                    // Enemy has reached the bottom row
                    state.defeated = true;
                }
            }
        }
    }
}

function removeCardFromGrid(index) {
    const card = state.gameGrid[index];
    if (card && card.type === 'card') {
        // Remove from grid
        state.gameGrid[index] = 0;

        // Remove from permanentDeck
        const cardIndex = state.permanentDeck.indexOf(card);
        if (cardIndex !== -1) {
            state.permanentDeck.splice(cardIndex, 1);
        }
    }
}

function handleCardMerging() {
    if (state.currentHand.length >= 2) {
        const [card1, card2] = state.currentHand.slice(0, 2);
        let higherAttackCard, lowerAttackCard;
        if (card1.attack >= card2.attack) {
            higherAttackCard = card1;
            lowerAttackCard = card2;
        } else {
            higherAttackCard = card2;
            lowerAttackCard = card1;
        }

        // Decide which function to transfer
        const lowerHasScoring = lowerAttackCard.scoringFunctions.length > 0;
        const lowerHasEndOfTurn = lowerAttackCard.endOfTurnFunctions.length > 0;

        if (lowerHasScoring && lowerHasEndOfTurn) {
            const randomChoice = Math.random() < 0.5 ? 'scoring' : 'endOfTurn';
            if (randomChoice === 'scoring') {
                higherAttackCard.scoringFunctions.push(...lowerAttackCard.scoringFunctions);
            } else {
                higherAttackCard.endOfTurnFunctions.push(...lowerAttackCard.endOfTurnFunctions);
            }
        } else if (lowerHasScoring) {
            higherAttackCard.scoringFunctions.push(...lowerAttackCard.scoringFunctions);
        } else if (lowerHasEndOfTurn) {
            higherAttackCard.endOfTurnFunctions.push(...lowerAttackCard.endOfTurnFunctions);
        }

        // Combine colors
        higherAttackCard.color = [...new Set([...higherAttackCard.color, ...lowerAttackCard.color])];

        // Remove lowerAttackCard from currentHand
        const lowerIndexInHand = state.currentHand.indexOf(lowerAttackCard);
        if (lowerIndexInHand !== -1) {
            state.currentHand.splice(lowerIndexInHand, 1);
        }

        // Remove lowerAttackCard from currentDeck
        const lowerIndexInDeck = state.currentDeck.indexOf(lowerAttackCard);
        if (lowerIndexInDeck !== -1) {
            state.currentDeck.splice(lowerIndexInDeck, 1);
        }

        // Remove lowerAttackCard from permanentDeck
        const lowerTemplate = lowerAttackCard.template;
        const lowerTemplateIndex = state.permanentDeck.indexOf(lowerAttackCard);
        if (lowerTemplateIndex !== -1) {
            state.permanentDeck.splice(lowerTemplateIndex, 1);
        }

        // Remove higherAttackCard from permanentDeck
        const higherTemplate = higherAttackCard.template;
        const higherTemplateIndex = state.permanentDeck.indexOf(higherAttackCard);
        if (higherTemplateIndex !== -1) {
            state.permanentDeck.splice(higherTemplateIndex, 1);
        }

        // Create new merged card template
        const mergedCardTemplate = {
            color: higherAttackCard.color,
            attack: higherAttackCard.attack,
            scoringFunctions: [...higherAttackCard.scoringFunctions],
            endOfTurnFunctions: [...higherAttackCard.endOfTurnFunctions]
        };

        // Add the merged card template to permanentDeck
        const mergedCardInstance = createCardInstance(mergedCardTemplate);
        state.permanentDeck.push(mergedCardInstance);

        // Update higherAttackCard's template reference and properties
        higherAttackCard.template = mergedCardTemplate;
        higherAttackCard.color = mergedCardInstance.color;
        higherAttackCard.attack = mergedCardInstance.attack;
        higherAttackCard.scoringFunctions = [...mergedCardInstance.scoringFunctions];
        higherAttackCard.endOfTurnFunctions = [...mergedCardInstance.endOfTurnFunctions];

        // Replace higherAttackCard in currentDeck with updated card
        const higherIndexInDeck = state.currentDeck.indexOf(higherAttackCard);
        if (higherIndexInDeck !== -1) {
            state.currentDeck[higherIndexInDeck] = higherAttackCard;
        }

        // Replace higherAttackCard in currentHand with updated card
        const higherIndexInHand = state.currentHand.indexOf(higherAttackCard);
        if (higherIndexInHand !== -1) {
            state.currentHand[higherIndexInHand] = higherAttackCard;
        }
    }
}



// Function to render the enemy info div
function createEnemyInfoDivs() {
    const enemyInfoContainer = document.createElement('div');
    enemyInfoContainer.id = 'enemy-info-container';
    enemyInfoContainer.style.display = 'grid';
    enemyInfoContainer.style.gridTemplateColumns = 'repeat(4, 100px)';
    enemyInfoContainer.style.gridColumnGap = '5px';
    enemyInfoContainer.style.marginBottom = '10px';

    for (let i = 0; i < 4; i++) {
        const enemyDiv = document.createElement('div');
        enemyDiv.classList.add('enemy-info');
        enemyDiv.style.border = '1px solid #333';
        enemyDiv.style.padding = '10px';
        enemyDiv.style.textAlign = 'center';
        enemyDiv.style.backgroundColor = '#f0f0f0';

        const enemy = state.enemies[i];
        if (enemy) {
            const turnsLeft = enemy.turnsTilAttack;
            enemyDiv.innerHTML = `
                <strong>Enemy ${i + 1}</strong><br>
                HP: ${enemy.currentHealth}/${enemy.maxHealth}<br>
                Turns Til Attack: ${turnsLeft}
            `;
        } else {
            enemyDiv.innerHTML = `<strong>Enemy ${i + 1}</strong><br>No Enemy`;
        }

        enemyInfoContainer.appendChild(enemyDiv);
    }
    return enemyInfoContainer;
}


function renderGridSquare(value, index) {
    const square = document.createElement('div');
    square.classList.add('grid-square');

    if (value === 0) {
        if (state.status === 'placing-card') {
            // Check if there's an enemy below this square
            const row = Math.floor(index / 4);
            const col = index % 4;
            let hasEnemyBelow = false;
            for (let r = row + 1; r < 4; r++) {
                const enemy = state.enemies[col];
                if (enemy && enemy.position === r) {
                    hasEnemyBelow = true;
                    break;
                }
            }

            if (!hasEnemyBelow) {
                square.style.backgroundColor = '#ccffcc'; // Light green
                square.style.cursor = 'pointer';

                square.addEventListener('click', () => {
                    const selectedCard = state.currentHand[state.selectedCardIndex];
                    state.gameGrid[index] = selectedCard;

                    state.currentHand.splice(state.selectedCardIndex, 1);

                    state.status = 'grid';
                    state.selectedCardIndex = null;

                    renderScreen();
                });
            } else {
                square.style.backgroundColor = 'black';
            }
        } else {
            square.style.backgroundColor = 'black';
        }
    } else if (value.type === 'card') {
        // Calculate adjusted attack value using scoringFunctions
        let cardAttack = value.attack;
        if (Array.isArray(value.scoringFunctions)) {
            for (let func of value.scoringFunctions) {
                cardAttack += func(index);
            }
        }
        // Handle gradient background
        if (value.color.length > 1) {
            square.style.background = `linear-gradient(to right, ${value.color.join(', ')})`;
        } else {
            square.style.backgroundColor = value.color[0];
        }
        square.textContent = cardAttack;
    } else if (value.type === 'enemy') {
        // Render enemy
        square.style.backgroundColor = 'grey';
        square.textContent = `E: ${value.currentHealth}`;
    }

    return square;
}

// Function to render the grid container
function createGridContainer() {
    const gridContainer = document.createElement('div');
    gridContainer.id = 'grid-container';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(4, 100px)';
    gridContainer.style.gridTemplateRows = 'repeat(4, 100px)';
    gridContainer.style.gridGap = '5px';

    state.gameGrid.forEach((value, index) => {
        const square = renderGridSquare(value, index);
        gridContainer.appendChild(square);
    });

    return gridContainer;
}

// Function to render the end turn button
function createEndTurnButton() {
    const endTurnButton = document.createElement('button');
    endTurnButton.id = 'end-turn-button';

    endTurnButton.textContent = `End Turn & Attack`;

    endTurnButton.addEventListener('click', () => {
        // Calculate and apply damage to each enemy
        const damagePerColumn = calculateDamagePerColumn();
        for (let col = 0; col < 4; col++) {
            const enemy = state.enemies[col];
            if (enemy) {
                enemy.currentHealth -= damagePerColumn[col];
                if (enemy.currentHealth < 0) enemy.currentHealth = 0;
            }
        }

        // Remove enemies with HP <=0
        for (let col = 0; col < 4; col++) {
            const enemy = state.enemies[col];
            if (enemy && enemy.currentHealth <= 0) {
                // Clear the enemy from the grid if it's on the board
                if (enemy.position >= 0 && enemy.position < 4) {
                    const index = enemy.position * 4 + col;
                    state.gameGrid[index] = 0;
                }
                state.enemies[col] = null;
            }
        }

        // Check for victory
        const activeEnemies = state.enemies.filter(enemy => enemy !== null);
        if (activeEnemies.length === 0) {
            alert('You defeated all enemies!');
            // Handle victory (e.g., reset game or proceed to next level)
            return;
        }

        // Handle enemy actions (decrement turnsTilAttack and attack/move)
        handleEnemyActions();

        // Check for defeat after enemy actions
        if (state.defeated) {
            alert('An enemy has broken through! You lose.');
            // Handle defeat (e.g., reset game or display lose screen)
            return;
        }

        // Handle end-of-turn effects
        handleEndOfTurnEffects();

        // Draw new hand
        drawHand();

        // Render the updated screen
        renderScreen();
    });

    return endTurnButton;
}
    


// Function to render the hand area
function createHandArea() {
    const handArea = document.createElement('div');
    handArea.id = 'hand-area';

    const handContainer = document.createElement('div');
    handContainer.id = 'hand-container';

    state.currentHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('hand-card');
        cardDiv.style.cursor = 'pointer';

        // Handle gradient background for multiple colors
        if (card.color.length > 1) {
            cardDiv.style.background = `linear-gradient(to right, ${card.color.join(', ')})`;
        } else {
            cardDiv.style.backgroundColor = card.color[0];
        }

        cardDiv.textContent = card.attack;

        cardDiv.addEventListener('click', () => {
            state.status = 'placing-card';
            state.selectedCardIndex = index;

            renderScreen();
        });

        handContainer.appendChild(cardDiv);
    });

    const endTurnButton = createEndTurnButton();

    handArea.appendChild(handContainer);
    handArea.appendChild(endTurnButton);

    return handArea;
}

// Function to render the entire screen
function renderScreen() {
    document.body.innerHTML = '';

    const enemyInfoContainer = createEnemyInfoDivs();
    const gridContainer = createGridContainer();
    const handArea = createHandArea();

    document.body.appendChild(enemyInfoContainer);
    document.body.appendChild(gridContainer);
    document.body.appendChild(handArea);
}

// Initial setup
initializePermanentDeck()
initializeEnemies();
createCurrentDeck()
drawHand();
renderScreen();

