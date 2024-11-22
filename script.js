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
        { maxHealth: 40, currentHealth: 40, turnsTilAttack: 5 },
        { maxHealth: 45, currentHealth: 45, turnsTilAttack: 6 },
        { maxHealth: 30, currentHealth: 30, turnsTilAttack: 4 },
        { maxHealth: 20, currentHealth: 20, turnsTilAttack: 3 },
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
        template: cardTemplate,
        color: Array.isArray(cardTemplate.color) ? [...cardTemplate.color] : [cardTemplate.color],
        attack: cardTemplate.attack,
        scoringFunctions: [...cardTemplate.scoringFunctions],
        endOfTurnFunctions: [...cardTemplate.endOfTurnFunctions]
    };
}

// Function to create a sample deck with 16 randomly chosen cards
function createSampleDeck() {
    const deck = [];
    for (let i = 0; i < 10; i++) {
        const randomCardTemplate = cardSamples[Math.floor(Math.random() * cardSamples.length)];
        const cardInstance = createCardInstance(randomCardTemplate);
        deck.push(cardInstance);
    }
    return deck;
}





// Initialize the deck
state.currentDeck = createSampleDeck();

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
function calculateScore() {
    let totalScore = 0;
    for (let index = 0; index < state.gameGrid.length; index++) {
        const card = state.gameGrid[index];
        if (card !== 0) {
            let cardAttack = card.attack;
            if (Array.isArray(card.scoringFunctions)) {
                for (let func of card.scoringFunctions) {
                    cardAttack += func(index);
                }
            }
            totalScore += cardAttack;
        }
    }
    return totalScore;
}

function handleEndOfTurnEffects() {
    state.gameGrid.forEach((card, index) => {
        if (card !== 0 && Array.isArray(card.endOfTurnFunctions)) {
            for (let func of card.endOfTurnFunctions) {
                func(index);
            }
        }
    });

    // Implement card merging logic
    handleCardMerging();
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

        // Remove lowerAttackCard's template from permanentDeck
        const lowerTemplate = lowerAttackCard.template;
        const lowerTemplateIndex = state.permanentDeck.indexOf(lowerTemplate);
        if (lowerTemplateIndex !== -1) {
            state.permanentDeck.splice(lowerTemplateIndex, 1);
        }

        // Remove higherAttackCard's template from permanentDeck
        const higherTemplate = higherAttackCard.template;
        const higherTemplateIndex = state.permanentDeck.indexOf(higherTemplate);
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
        state.permanentDeck.push(mergedCardTemplate);

        // Update higherAttackCard's template reference
        higherAttackCard.template = mergedCardTemplate;

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

    for (let i = 0; i < 4; i++) {
        const enemyDiv = document.createElement('div');
        enemyDiv.classList.add('enemy-info');
        const enemy = state.enemies[i];
        const turnsLeft = enemy.turnsTilAttack - state.currentTurn + 1;
        enemyDiv.textContent = `Enemy ${i + 1}\nHP: ${enemy.currentHealth}/${enemy.maxHealth}\nAttacks in: ${turnsLeft} turns`;
        enemyInfoContainer.appendChild(enemyDiv);
    }
    return enemyInfoContainer;
}

// Function to render a grid square
function renderGridSquare(value, index) {
    const square = document.createElement('div');
    square.classList.add('grid-square');

    if (value === 0) {
        if (state.status === 'placing-card') {
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

    const damage = calculateScore();
    endTurnButton.textContent = `End Turn (Deal ${damage} damage)`;

    endTurnButton.addEventListener('click', () => {
    // For each column, calculate the damage and apply it to the corresponding enemy
    for (let col = 0; col < 4; col++) {
        let columnDamage = 0;
        for (let row = 0; row < 4; row++) {
            const index = row * 4 + col;
            const card = state.gameGrid[index];
            if (card !== 0) {
                let cardAttack = card.attack;
                if (Array.isArray(card.scoringFunctions)) {
                    for (let func of card.scoringFunctions) {
                        cardAttack += func(index);
                    }
                }
                columnDamage += cardAttack;
            }
        }
        const enemy = state.enemies[col];
        enemy.currentHealth -= columnDamage;
        if (enemy.currentHealth < 0) enemy.currentHealth = 0;
    }

    state.currentTurn += 1;

    // Handle end-of-turn effects
    handleEndOfTurnEffects();
    drawHand();
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
drawHand();
renderScreen();

