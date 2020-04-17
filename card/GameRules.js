const configuration = require('../conf/poker.json');

const Deck = require('./Deck');
const Card = require('./Card');
const Combinaison = require('./Combinaison');

const NOT_FOUND = -1;

function GameRules(){
    const MODULE_NAME = "GameRules";
    let logger = null;
    let deck = null;
    const STEPS = configuration.stepGame;
    let currentStepGame = null;
    
    let currentPlayerCards = null;
    let otherPlayersCards = null;

    const INDEXCOLUMNCPTCOLORS = configuration.cardsByColor.length + 2;
    const INDEXLINECPTVALUES = configuration.colors.length + 1;

    this.setLogger = function (loggerInstance){
        logger = loggerInstance;
    }

    this.init = function(){
        logger.info(MODULE_NAME, "Initialisation du systeme de jeu");
        deck = new Deck(configuration.colors, configuration.cardsByColor);
        deck.setLogger(logger);
        deck.init();
        deck.shuffle();
        currentStepGame = STEPS.WAITING_PLAYERS;
        otherPlayersCards = [];
    }

    this.changeStepGame = function(){
        let oldStepName = currentStepGame.name;
        switch (currentStepGame.name){
            case STEPS.WAITING_PLAYERS.name :
                currentStepGame = STEPS.CONNEXION_PLAYERS;
                break;
            case STEPS.CONNEXION_PLAYERS.name :
                currentStepGame = STEPS.CHECK_READY_PLAYERS;
                break;
            case STEPS.CHECK_READY_PLAYERS.name :
                currentStepGame = STEPS.READY_PLAYERS;
                break;
            // case STEPS.GIVING_TOKENS.name :
            //     currentStepGame = STEPS.READY_PLAYERS;
            //     break;
            case STEPS.READY_PLAYERS.name :
                currentStepGame = STEPS.PREFLOP;
                break;
            case STEPS.PREFLOP.name :
                currentStepGame = STEPS.FLOP;
            break;
            case STEPS.FLOP.name :
                currentStepGame = STEPS.TURN;
            break;
            case STEPS.TURN.name :
                currentStepGame = STEPS.RIVER;
            break;
            case STEPS.RIVER.name :
                currentStepGame = STEPS.CHECK_WINNER;
            break;
            case STEPS.CHECK_WINNER.name :
                currentStepGame = STEPS.END_ROUND;
            break;
        }
        logger.info(MODULE_NAME, "Changement d'etape de jeu : " + oldStepName + " => " + currentStepGame.name);
    }

    this.startNewRound = function(){
        logger.info(MODULE_NAME, "Debut d'une nouvelle partie.. ");
        currentStepGame = STEPS.READY_PLAYERS;
        logger.info(MODULE_NAME, "Changement de l'etat : " + currentStepGame.name);
        logger.info(MODULE_NAME, "Reset des cartes des joueurs");
        otherPlayersCards = [];
        logger.info(MODULE_NAME, "Reinitialisation du deck");
        deck.init();
        deck.shuffle();
    }

    this.getCurrentStepGame = function(){
        return currentStepGame;
    }

    this.getSteps = function(){
        return STEPS;
    }

    this.getNextCard = function(isBurned = false){
        if (isBurned){
            logger.debug(MODULE_NAME, 'Carte brulee !');
            deck.getNexCard();
        }
        return deck.getNexCard();
    }


    this.addCardsOtherPlayer = function(playerToProcess){
        let player = null;
        for (var i = 0; i < otherPlayersCards.length; i++){
            if (otherPlayersCards[i].playerID == playerToProcess.getSocketID())
            {
                player = otherPlayersCards[i];
                break;
            }
        }
        if (player == null){
            otherPlayersCards.push({
                'playerID' : playerToProcess.getSocketID(),
                'cards' : playerToProcess.getCards(),
                'histogram' : this.initHistogram(playerToProcess.getCards()),
                'combinaisons' : []
            });
        }
        else {
            player.cards = playerToProcess.getCards();
            player.histogram = this.updateHistogram(player.histogram, playerToProcess.getCards());
        }
    }

    this.initHistogram = function(cards){
        let histogram;

        for (var c = 0; c < INDEXLINECPTVALUES; c++){
            for (var v = 0; v < INDEXCOLUMNCPTCOLORS; v++){
                histogram[c][v] = NOT_FOUND;
            }
        }

        return this.updateHistogram(histogram, cards);
    }

    this.getCardsByColor = function(colorIndex){

    }

    this.getCardsByValue = function(valueIndex){

    }

    

    this.updateHistogram = function(histogram, cards){

        let colorIndex;
        let valueIndex;
        for(var i = 0; i < cards.length; i++){
            colorIndex = cards[i].getColorIndex();
            valueIndex = cards[i].getValueIndex();
            histogram[colorIndex][valueIndex] = i;

            histogram[INDEXLINECPTVALUES][valueIndex]++;
            histogram[colorIndex][INDEXCOLUMNCPTCOLORS]++;

            // Cas de l'AS
            if (valueIndex == configuration.cardsByColor.length - 1){
                histogram[colorIndex][0] = i;
                histogram[INDEXLINECPTVALUES][0]++;
            }
        }

        return histogram;
    }

    this.calculateCombinaisons = function(player){
        
    }


    this.getWinners = function(){
        let winners = [];

        return winners;
    }
}

module.exports = GameRules;