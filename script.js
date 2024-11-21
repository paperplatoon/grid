//Need a way to merge cards together - automatically on the board? after a round?
//start with a worse deck lol
//add a way to add cards after each combat

// Define the state object
const state = {
    // Turn
    currentTurn: 1,

    // Cards
    gameGrid: new Array(16).fill(0), // 4x4 grid initialized with zeros
    currentDeck: [],
    currentHand: [],
    status: 'grid',
    selectedCardIndex: null,

    // Enemy
    enemy: {
        maxHealth: 120,
        currentHealth: 120,
        turnsToWin: 5
    },
};

// Sample card objects with different colors and attack properties
const cardSamples = [
    {
        color: 'red',
        attack: 1,
        scoringFunction: redBoost,
        endOfTurnFunction: null
    },
    {
        color: 'blue',
        attack: 2,
        scoringFunction: blueTopRowBoost,
        endOfTurnFunction: null
    },
    {
        color: 'green',
        attack: 3,
        scoringFunction: null,
        endOfTurnFunction: greenGrow
    },
    {
        color: 'yellow',
        attack: 1,
        scoringFunction: yellowRowBoost,
        endOfTurnFunction: null
    },
    {
        color: 'purple',
        attack: 1,
        scoringFunction: null,
        endOfTurnFunction: purpleBoostAdjacent
    }
];


function createCardInstance(cardTemplate) {
    return {
        color: cardTemplate.color,
        attack: cardTemplate.attack,
        scoringFunction: cardTemplate.scoringFunction,
        endOfTurnFunction: cardTemplate.endOfTurnFunction
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
        if (i !== cardIndex && gridCards[i] !== 0 && gridCards[i].color === 'red') {
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
        if (index !== cardIndex && state.gameGrid[index] !== 0 && state.gameGrid[index].color === 'yellow') {
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
            if (typeof card.scoringFunction === 'function') {
                cardAttack += card.scoringFunction(index);
            }
            totalScore += cardAttack;
        }
    }
    return totalScore;
}

function handleEndOfTurnEffects() {
    state.gameGrid.forEach((card, index) => {
        if (card !== 0 && typeof card.endOfTurnFunction === 'function') {
            card.endOfTurnFunction(index); // Trigger the end-of-turn function
        }
    });
}



// Function to render the enemy info div
function createEnemyInfoDiv() {
    const enemyInfoDiv = document.createElement('div');
    enemyInfoDiv.id = 'enemy-info';

    const turnsLeft = state.enemy.turnsToWin - state.currentTurn + 1;
    enemyInfoDiv.textContent = `Enemy Health: ${state.enemy.currentHealth} | Turns Left: ${turnsLeft}`;

    return enemyInfoDiv;
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
        if (typeof value.scoringFunction === 'function') {
            cardAttack += value.scoringFunction(index);
        }
        square.style.backgroundColor = value.color;
        square.textContent = cardAttack;
    }

    return square;
}

// Function to render the grid container
function createGridContainer() {
    const gridContainer = document.createElement('div');
    gridContainer.id = 'grid-container';

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
        const damage = calculateScore();
        state.enemy.currentHealth -= damage;
    
        if (state.enemy.currentHealth <= 0) {
            alert('You defeated the enemy!');
            // Handle victory
        } else {
            state.currentTurn += 1;
    
            if (state.currentTurn > state.enemy.turnsToWin) {
                alert('You ran out of turns!');
                // Handle defeat
            } else {
                handleEndOfTurnEffects(); // Trigger end-of-turn effects
                drawHand();
                renderScreen();
            }
        }
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
        cardDiv.style.backgroundColor = card.color;
        cardDiv.textContent = card.attack;
        cardDiv.style.cursor = 'pointer';

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

    const enemyInfoDiv = createEnemyInfoDiv();
    const gridContainer = createGridContainer();
    const handArea = createHandArea();

    document.body.appendChild(enemyInfoDiv);
    document.body.appendChild(gridContainer);
    document.body.appendChild(handArea);
}

// Initial setup
drawHand();
renderScreen();

