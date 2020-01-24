
//Tell the library which element to use for the table
cards.init({table:'#card-table', blackJoker: true, redJoker: true});

//Create a new deck of cards
var deck = new cards.Deck(); 
//By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;

//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all); 
//No animation here, just get the deck onto the table.
deck.render({immediate:true});

//Now lets create a couple of hands, one face down, one face up.
var computerTop = new cards.Hand({faceUp:false, y:60});
var computerLeft = new cards.Hand({faceUp:false, y:200});
computerLeft.x -= 300;
var computerRight = new cards.Hand({faceUp:false, y:200});
computerRight.x += 300;
var human = new cards.Hand({faceUp:true, y:340});

//Lets add a discard pile
var gamePile = new cards.Deck({faceUp:true});
gamePile.x += 50;

var players = [
	{ player: human, isHuman: true, name: "Human", skipTurn: false },
	{ player: computerRight, isHuman: false, name: "Right computer", skipTurn: false },
	{ player: computerTop, isHuman: false, name: "Top computer", skipTurn: false },
	{ player: computerLeft, isHuman: false, name: "Left computer", skipTurn: false }
];

var currentPlayerIdx = 0;
var lastPlayerIdx = 0;
var nCardsPlayed = 0;
var nSkippedTurns = 0;

const computerPlayDelay = 1000;

const TWO = 15;
const ACE = 14;
const JOKER = 16;

function displayCurrentPlayerName()
{
	$('#playerName').text("Current player: " + players[currentPlayerIdx].name);
}

function getCurrentPlayer() {
	displayCurrentPlayerName();
	return players[currentPlayerIdx].player;
}

function getCurrentPlayerName() {
	return players[currentPlayerIdx].name;
}

function getNextPlayer() {
	if (nSkippedTurns < players.length)
	{
		currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
	}
	else
	{
		closeGame();
		currentPlayerIdx = lastPlayerIdx;
		nSkippedTurns = 0;
	}
	return getCurrentPlayer();
}

function getPreviousPlayer() {
	return players[currentPlayerIdx === 0 ? players.length - 1 : currentPlayerIdx - 1].player;
}

function isCurrentPlayerHuman() {
	return players[currentPlayerIdx].isHuman;
}

function getCardRank(card) {
	var rank = card.rank;

	switch (card.rank) {
		case 1:
			rank = ACE;
			break;

		case 2:
			rank = TWO;
			break;

		case 0:
			rank = JOKER;
			break;
	
		default:
			rank = card.rank;
			break;
	}

	return rank;
}

function compareCards(a, b)
{
	var rankA = getCardRank(a);
	var rankB = getCardRank(b);

	if (rankA > rankB)
	{
		return 1;
	}
	else
	{
		return -1;
	}
}

//Let's deal when the Deal button is pressed:
$('#deal').click(function() {
	//Deck has a built in method to deal to hands.
	$('#deal').hide();
	var playersArray = [];
	players.forEach(p => {
		playersArray.push(p.player);
	});
	deck.deal(cards.all.length / playersArray.length, playersArray, 50, function() {
		playersArray.forEach(player => {
			player.sort(compareCards);
			player.render();
		});
	});

	displayCurrentPlayerName();
});

var selectedCards = [];

function isSelected(aCard)
{
	return selectedCards.indexOf(aCard) >= 0;
}

function selectCard(aCard)
{
	aCard.moveTo(aCard.targetLeft + cards.options.cardSize.width / 2, aCard.targetTop  + cards.options.cardSize.height / 2 - 20);
	selectedCards.push(aCard);
}

function deselectCard(aCard)
{
	aCard.moveTo(aCard.targetLeft + cards.options.cardSize.width / 2, aCard.targetTop + cards.options.cardSize.height / 2);
	selectedCards.splice(selectedCards.indexOf(aCard), 1);
}

human.click(function(card){
	if (!isSelected(card))
	{
		selectCard(card);
	}
	else
	{
		deselectCard(card);
	}
});

function getMaxRank(hand)
{
	var maxRank = 0;
	if (hand.length === 0)
	{
		return maxRank;
	}

	hand.forEach(card => {
		var rank = getCardRank(card);
		if (rank > maxRank)
		{
			maxRank = rank;
		}
	});

	return maxRank;
}

function getRandomCard(hand) {
	if (hand.length === 0)
	{
		return null;
	}
	
	return hand[Math.floor(Math.random() * hand.length)];
}

function closeGame()
{
	while (gamePile.length > 0) {
		deck.addCard(gamePile.topCard());
	}

	deck.render();
	gamePile.render();
}

function getRandomCardGreaterThan(player, minRank)
{
	var randomCard;
	var randomCardRank;
	do {
		randomCard = getRandomCard(player);
		randomCardRank = getCardRank(randomCard);
	} while (randomCardRank < minRank);

	return randomCard;
}

function getComputerCards(player)
{
	var cards = [];
	var gamePileTopCardRank = 0;

	if (gamePile.length > 0)
	{
		gamePileTopCardRank = getCardRank(gamePile.topCard());
	}

	var maxRank = getMaxRank(player);

	if (maxRank < gamePileTopCardRank)
	{
		return cards;
	}

	if (nCardsPlayed === 0)
	{
		nCardsPlayed = 1;
	}

	if (nCardsPlayed === 1)
	{
		var sameRankRequired = false;
		if (gamePile.length > 1)
		{
			// Check rank of card under top one
			sameRankRequired = getCardRank(gamePile[gamePile.length - 2]) == gamePileTopCardRank;
		}

		if (sameRankRequired && !getPreviousPlayer().skipTurn) // Previous player passed, playing a card of same rank is not required
		{
			for (var index = 0; index < player.length; index++) {
				const card = player[index];
				if (getCardRank(card) == getCardRank(gamePile[gamePile.length - 2]))
				{
					cards.push(card);
					break;
				}
			}
		}
		else
		{
			var cardTwo = null;
			var cardJoker = null;

			if (gamePile.length > 0)
			{
				for (let cardIdx = 0; cardIdx < player.length; cardIdx++)
				{
					const card = player[cardIdx];
					if (getCardRank(card) === TWO)
					{
						cardTwo = card;
					}
					if (getCardRank(card) === JOKER)
					{
						cardJoker = card;
					}
				}
			}

			if (gamePileTopCardRank > 11 && cardTwo)
				cards.push(cardTwo);
			else if (gamePileTopCardRank > 11 && cardJoker)
				cards.push(cardJoker);
			else
			{
				var randomCard = getRandomCardGreaterThan(player, gamePileTopCardRank);
				cards.push(randomCard);
			}
		}
	}
	else if (nCardsPlayed === 2)
	{
		// Find 2 cards greater or equals gamePileTopCardRank
		for (let cardIdx = 0; cardIdx < player.length; cardIdx++)
		{
			const card = player[cardIdx];

			if (getCardRank(card) < gamePileTopCardRank)
			{
				continue;
			}

			const nextCard = cardIdx === player.length - 1 ? null : player[cardIdx + 1];

			if (nextCard && getCardRank(card) === getCardRank(nextCard))
			{
				cards.push(card);
				cards.push(nextCard);
				break;
			}
		}
	}
	else if (nCardsPlayed === 3)
	{
		// Find 3 cards greater or equals gamePileTopCardRank
		for (let cardIdx = 0; cardIdx < player.length; cardIdx++)
		{
			const card = player[cardIdx];
			
			if (getCardRank(card) < gamePileTopCardRank)
			{
				continue;
			}

			const nextCard = cardIdx === player.length - 1 ? null : player[cardIdx + 1];
			const nextNextCard = cardIdx === player.length - 2 ? null : player[cardIdx + 2];

			if (nextCard && nextNextCard && getCardRank(card) === getCardRank(nextCard) &&
				getCardRank(card) === getCardRank(nextNextCard))
			{
				cards.push(card);
				cards.push(nextCard);
				cards.push(nextNextCard);
				break;
			}
		}
	}

	return cards;
}

function computer(player)
{
	if (player.length === 0)
		return;

	var computerCards = getComputerCards(player);
	
	if (computerCards.length == 0)
	{
		alert(getCurrentPlayerName() + " says: Pass!");
		player.skipTurn = true;
		nSkippedTurns++;
		closeGameIfNeeded();
		return;
	}

	player.skipTurn = false;
	nSkippedTurns = 0;
	lastPlayerIdx = currentPlayerIdx;

	nCardsPlayed = computerCards.length;

	computerCards.forEach(card => {
		gamePile.addCard(card);
	});
	
	gamePile.render();
	player.render({
		callback: closeGameIfNeeded
	});
}

function moveGamePileCards()
{
	for (var index = 0; index < nCardsPlayed; index++)
	{
		const aCard = gamePile[gamePile.length - 1 - index];
		aCard.moveTo(aCard.targetLeft + cards.options.cardSize.width / 2 + (20 * index), aCard.targetTop  + cards.options.cardSize.height / 2);
	}
}

function gameMustBeClosed()
{
	if (gamePile.length === 0)
		return false;

	var gamePileTopCardRank = getCardRank(gamePile.topCard());

	// Check if all cards of same figure have been played
	if (gamePile.length >= 4 &&
		getCardRank(gamePile[gamePile.length - 2]) == gamePileTopCardRank &&
		getCardRank(gamePile[gamePile.length - 3]) == gamePileTopCardRank &&
		getCardRank(gamePile[gamePile.length - 4]) == gamePileTopCardRank)
	{
		return true;
	}

	if (nCardsPlayed === 1)
	{
		if (gamePileTopCardRank === TWO || gamePileTopCardRank === JOKER)
		{
			return true;
		}	
	}
	else if (nCardsPlayed === 2)
	{
		if ((gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == TWO) ||
			(gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == JOKER) ||
			(gamePileTopCardRank === JOKER && getCardRank(gamePile[gamePile.length - 2]) == TWO) ||
			(gamePileTopCardRank === JOKER && getCardRank(gamePile[gamePile.length - 2]) == JOKER))
		{
			return true;
		}
	}
	else if (nCardsPlayed === 3)
	{
		if ((gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == TWO && getCardRank(gamePile[gamePile.length - 3]) == TWO) ||

			(gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == TWO && getCardRank(gamePile[gamePile.length - 3]) == JOKER) ||
			(gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == JOKER && getCardRank(gamePile[gamePile.length - 3]) == TWO) ||
			(gamePileTopCardRank === JOKER && getCardRank(gamePile[gamePile.length - 2]) == TWO && getCardRank(gamePile[gamePile.length - 3]) == TWO) ||

			(gamePileTopCardRank === TWO && getCardRank(gamePile[gamePile.length - 2]) == JOKER && getCardRank(gamePile[gamePile.length - 3]) == JOKER) ||
			(gamePileTopCardRank === JOKER && getCardRank(gamePile[gamePile.length - 2]) == TWO && getCardRank(gamePile[gamePile.length - 3]) == JOKER) ||
			(gamePileTopCardRank === JOKER && getCardRank(gamePile[gamePile.length - 2]) == JOKER && getCardRank(gamePile[gamePile.length - 3]) == TWO))
		{
			return true;
		}
	}

	return false;
}

function closeGameIfNeeded()
{
	moveGamePileCards();

	if (gameMustBeClosed())
	{
		setTimeout(function() {
			closeGame();
		}, 1000);

		if(!isCurrentPlayerHuman())
		{
			// Same player plays again
			setTimeout(function() {
				computer(getCurrentPlayer());
			}, computerPlayDelay);
		}
	}
	else
	{
		var nextPlayer = getNextPlayer();
		if(!isCurrentPlayerHuman())
		{
			setTimeout(function() {
				computer(nextPlayer);
			}, computerPlayDelay);
		}
	}
}

$('#play').click(function() {
	nCardsPlayed = selectedCards.length;

	if (nCardsPlayed === 0)
		return;

	getCurrentPlayer().skipTurn = false;
	nSkippedTurns = 0;
	lastPlayerIdx = currentPlayerIdx;

	selectedCards.forEach(card => {
		gamePile.addCard(card);
	});

	human.render();
	gamePile.render({
		callback: closeGameIfNeeded
	});

	selectedCards = [];
});

$('#skip').click(function() {
	nSkippedTurns++;
	computer(getNextPlayer());
});
