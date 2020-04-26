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
    const COMBINAISONS = configuration.combinaisons;
    // const COMBINAISONS = configuration.combinaisons;.sort((a, b) => {
    //     let comparaison = 0;

    //     if (a.strength > b.strength){
    //         comparaison = -1;
    //     }
    //     else if (a.strength < b.strength){
    //         comparaison = 1;
    //     }

    //     return comparaison;
    // });
    let currentStepGame = null;
    
    let currentPlayerCards = null;
    let otherPlayersCards = null;

    const INDEXCOLUMNCPTCOLORS = configuration.cardsByColor.length + 1;
    const INDEXLINECPTVALUES = configuration.colors.length;

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
        console.log("Others players before reset...." + otherPlayersCards);
        otherPlayersCards = [];
        console.log("Others players after reset...." + otherPlayersCards);
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
        logger.info(MODULE_NAME, " Traitement des cartes pour " + playerToProcess.getName());
        let player = null;
        for (var i = 0; i < otherPlayersCards.length; i++){
            if (otherPlayersCards[i].playerID == playerToProcess.getSocketID())
            {
                player = otherPlayersCards[i];
                break;
            }
        }
        if (player == null){
            // logger.debug(MODULE_NAME, "Ajout des infos pour le player");
            let histogram = this.initHistogram(playerToProcess.getCards());
            otherPlayersCards.push({
                'playerID' : playerToProcess.getSocketID(),
                'name' : playerToProcess.getName(),
                'cards' : playerToProcess.getCards(),
                'histogram' : histogram,
                'combinaisons' : []
            });
        }
        else {
            player.cards = playerToProcess.getCards();
            player.histogram = this.updateHistogram(player.histogram, playerToProcess.getCards());
        }
    }

    this.initHistogram = function(cards){
        // TODO : corriger déclaration de la variable histogram pour avoir un tableau [][]
        let histogram = []; 

        logger.debug(MODULE_NAME, "Init histogram avec les cartes : " + cards);
        for (var c = 0; c <= INDEXLINECPTVALUES; c++){
            histogram[c] = [];
        }
        
        for (var c = 0; c < INDEXLINECPTVALUES; c++){
            for (var v = 0; v < INDEXCOLUMNCPTCOLORS; v++){
                // on initialise la valeur par défaut de l'histogramme
                histogram[c][v] = NOT_FOUND;
            }
            // à l'initialisation, nous n'avons aucune carte d'une couleur
            histogram[c][INDEXCOLUMNCPTCOLORS] = 0;
        }
        
        // à l'initialisation, nous n'avons aucune carte d'une valeur
        // parcours supplémentaire pour éviter de faire 14 fois l'affectation
        for (var v = 0; v < INDEXCOLUMNCPTCOLORS; v++){
            histogram[INDEXLINECPTVALUES][v] = 0;
        }

        return this.updateHistogram(histogram, cards);
    }

    this.updateHistogram = function(histogram, cards){
        logger.debug(MODULE_NAME, "Mise a jour de l'histogram....");
        let colorIndex;
        let valueIndex;
        for(var i = 0; i < cards.length; i++){
            colorIndex = cards[i].getColorIndex();
            valueIndex = cards[i].getValueIndex() + 1;
            // on stocke l'index de la carte pour mieux la retrouver après
            histogram[colorIndex][valueIndex] = i;

            histogram[INDEXLINECPTVALUES][valueIndex]++;
            histogram[colorIndex][INDEXCOLUMNCPTCOLORS]++;

            // Cas de l'AS
            if (valueIndex == configuration.cardsByColor.length){
                histogram[colorIndex][0] = i;
                histogram[INDEXLINECPTVALUES][0]++;
            }
        }

        return histogram;
    }

    this.getCardsByColor = function(player, colorIndex){
        let cards = [];
        let card = null;
        for (var i = 0; i < INDEXCOLUMNCPTCOLORS - 1; i++){
            card = this.getCardByStatIndex(player, i, colorIndex);
            if (card != null){
                cards.push(card);
            }
        }
        return cards;
    }

    this.getCardsByValue = function(player, valueIndex){
        let cards = [];
        let card = null;
        for (var i = 0; i < INDEXLINECPTVALUES; i++){
            card = this.getCardByStatIndex(player, valueIndex, i);
            if (card != null){
                cards.push(card);
            }
        }
        return cards;
    }

    this.getCardByStatIndex = function(player, valueIndex, colorIndex){
        let indexCard = player.histogram[colorIndex][valueIndex]
        if (indexCard != NOT_FOUND){
            return player.cards[indexCard];
        }
        return null;
    }

    this.calculateCombinaisons = function(player){
        logger.info(MODULE_NAME, "Calcul des combinaisons pour le joueur " + player.name);
        console.log(player.histogram);
        let bestCombinaison = null;

        let paires = [];
        let brelans = [];
        let carre = NOT_FOUND;
        let color = NOT_FOUND;
        let quinte = [];
        let higthestCard = NOT_FOUND;

        // Calcul de la couleur
        for (var i = INDEXLINECPTVALUES - 1; i >= 0; i-- ){
            if (player.histogram[i][INDEXCOLUMNCPTCOLORS] == 5){
                // logger.debug(MODULE_NAME, "Couleur trouvee a la position " + i);
                color = i;
                break;
            }
        }


        // Calcul des combinaisons basées sur la valeur
        for (var i = INDEXCOLUMNCPTCOLORS - 1; i > 0; i-- ){            
            switch(player.histogram[INDEXLINECPTVALUES][i]){
                case 2 : 
                    // logger.debug(MODULE_NAME, "Paire trouvee a la position " + i);
                    paires.push(i);
                    break;
                case 3:
                    // logger.debug(MODULE_NAME, "Brelan trouve a la position " + i);
                    brelans.push(i);
                    break;
                case 4 :
                    // logger.debug(MODULE_NAME, "Carre trouve a la position " + i);
                    carre = i;
                    break;
            }

            if (player.histogram[INDEXLINECPTVALUES][i] > 0){
                if (higthestCard == NOT_FOUND){
                    // logger.debug(MODULE_NAME, "Carte la plus haute trouvee : " + i);
                    higthestCard = i;
                }
                // logger.debug(MODULE_NAME, "Ajout de la carte de valeur " + i + " dans la suite");
                quinte.push(i);
            }
            else if (quinte.length < 5){
                // logger.debug(MODULE_NAME, "Reinitialisation de la quinte...");
                quinte = [];
            }
        }

        if (quinte.length >= 5){
            let royale = false;
            let flush = false;
            let quinte_flush = [];
            console.log("Quinte trouvee : " + quinte);
            if (color != NOT_FOUND){
                console.log("==> Determination si quinte flush....");
                for (var i = 0; i < quinte.length; i++){
                    console.log("player.histogram[" + color + "]["+quinte[i]+"] : " + player.histogram[color][quinte[i]])
                    if (player.histogram[color][quinte[i]] != NOT_FOUND){
                        quinte_flush.push(quinte[i]);
                    }
                }
                flush = (quinte_flush.length == 5);
                if (flush){
                    console.log("==> Quinte flush trouvee");
                    console.log("===> Determination si quinte flush royale....");
                    royale = (quinte_flush[0] == 13) && (quinte_flush[4] == 9);
                    if(royale){
                        console.log("===> Quinte flush royale trouvee");
                    }
                }
            }
        }
        if (carre != NOT_FOUND){
            console.log("Carre : " + this.getCardsByValue(player, carre));
        }
        if (brelans.length > 0 && paires.length > 0){
            console.log("Full : { Brelan : " + this.getCardsByValue(player, brelans[0]) + " / Paire : " +  this.getCardsByValue(player, paires[0]) + " }");
        }
        if (color != NOT_FOUND){
            console.log("Couleur : " + this.getCardsByColor(player, color));
        }
        if (brelans.length > 0){
            console.log("Brelans : " + this.getCardsByValue(player, brelans[0]));
        }
        if (paires.length >= 2){
            console.log("Double paires : " + this.getCardsByValue(player, paires[0]) + ", " + this.getCardsByValue(player, paires[1]));
        } else if (paires.length == 1 ){
            console.log("Paires : " + this.getCardsByValue(player, paires[0]));
        }
        console.log("Carte la plus haute : " + this.getCardsByValue(player, higthestCard)[0]);
        
        return player;
    }


    this.getWinners = function(){
        logger.info(MODULE_NAME, "Determination des vainqeurs");
        let winners = [];
        let bestCombinaison = null;
        let bestCombinaisonPlayer = null;

        for (var indexPlayer in otherPlayersCards){
            bestCombinaisonPlayer = this.calculateCombinaisons(otherPlayersCards[indexPlayer]);
        }

        return winners;
    }
}

module.exports = GameRules;