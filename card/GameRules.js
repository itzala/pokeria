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
                'combinaisons' : [],
                'kickers' : []
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

    this.getCardsQuinteFlush = function(player, indexCards){
        let cards = [];
        for (var i = 0; i < indexCards.length; i++){
            cards.push(player.cards.get(indexCards[i]));
        }
        return cards;
    }

    this.getCardsQuinte = function(player, indexValueCards){
        let cards = [];
        for (var i = 0; i < indexValueCards.length; i++){
            cards.push(this.getCardsByValue(player, indexValueCards[i])[0]);
        }
        return cards;
    }

    this.getKickers = function(cardsPlayer, combinaison){
        let kickers = [];
        let nbKickers = combinaison.getNbNeededKickers();
        if (nbKickers > 0){
            
        }

        return kickers;
    }

    this.calculateCombinaisons = function(player){
        logger.info(MODULE_NAME, "Calcul des combinaisons pour le joueur " + player.name);
        // console.log(player.histogram);
        
        let paires = [];
        let brelans = [];
        let carre = NOT_FOUND;
        let color = NOT_FOUND;
        let quinte = [];
        let higthestCard = NOT_FOUND;

        let processedCombinaisons = [];

        // Calcul de la couleur
        for (var i = INDEXLINECPTVALUES - 1; i >= 0; i-- ){
            if (player.histogram[i][INDEXCOLUMNCPTCOLORS] == COMBINAISONS.COLOR.conditions.nbCards){
                // logger.debug(MODULE_NAME, "Couleur trouvee a la position " + i);
                color = i;
                break;
            }
        }


        // Calcul des combinaisons basées sur la valeur
        for (var i = INDEXCOLUMNCPTCOLORS - 1; i > 0; i-- ){            
            switch(player.histogram[INDEXLINECPTVALUES][i]){
                case COMBINAISONS.PAIRE.conditions.nbCards : 
                    // logger.debug(MODULE_NAME, "Paire trouvee a la position " + i);
                    paires.push(i);
                    break;
                case COMBINAISONS.BRELAN.conditions.nbCards:
                    // logger.debug(MODULE_NAME, "Brelan trouve a la position " + i);
                    brelans.push(i);
                    break;
                case COMBINAISONS.CARRE.conditions.nbCards :
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
            else if (quinte.length < COMBINAISONS.QUINTE.conditions.nbCards){
                // logger.debug(MODULE_NAME, "Reinitialisation de la quinte...");
                quinte = [];
            }
        }

        if (quinte.length >= COMBINAISONS.QUINTE.conditions.nbCards){
            let royale = false;
            let flush = false;
            let quinte_flush = [];
            console.log("Quinte trouvee : " + quinte);
            let quinteCards = null;
            if (color != NOT_FOUND){
                console.log("==> Determination si quinte flush....");
                for (var i = 0; i < quinte.length; i++){
                    console.log("player.histogram[" + color + "]["+quinte[i]+"] : " + player.histogram[color][quinte[i]])
                    if (player.histogram[color][quinte[i]] != NOT_FOUND){
                        quinte_flush.push(player.histogram[color][quinte[i]]);
                    }
                }
                flush = (quinte_flush.length >= COMBINAISONS.QUINTE.conditions.nbCards);
                if (flush){
                    console.log("==> Quinte flush trouvee");
                    console.log("===> Determination si quinte flush royale....");
                    royale = (quinte_flush[0] == 13) && (quinte_flush[4] == 9);
                    if(royale){
                        console.log("===> Quinte flush royale trouvee");
                        processedCombinaisons.push(new Combinaison(COMBINAISONS.QUINTE_FLUSH_ROYALE, this.getCardsQuinteFlush(player, quinte_flush)));
                    }
                    else {
                        processedCombinaisons.push(new Combinaison(COMBINAISONS.QUINTE_FLUSH, this.getCardsQuinteFlush(player, quinte_flush)));
                    }
                }
            }
            else {
                processedCombinaisons.push(new Combinaison(COMBINAISONS.QUINTE, this.getCardsQuinte(player, quinte)));
            }
        }
        if (carre != NOT_FOUND){
            let carreCards = this.getCardsByValue(player, carre);
            // console.log("Carre : " + carreCards);
            processedCombinaisons.push(new Combinaison(COMBINAISONS.CARRE, carreCards));
        }
        if (brelans.length > 0 && paires.length > 0){
            let brelanCards = this.getCardsByValue(player, brelans[0]);
            let paireCards = this.getCardsByValue(player, paires[0]);
            console.log("Full : { Brelan : " + brelanCards + " / Paire : " +  paireCards + " }");
            processedCombinaisons.push(new Combinaison(COMBINAISONS.FULL, null, 
                new Combinaison(COMBINAISONS.BRELAN, brelanCards),
                new Combinaison(COMBINAISONS.PAIRE,  paireCards)
            ));
        }
        if (color != NOT_FOUND){
            let colorCards = this.getCardsByColor(player, color);
            console.log("Couleur : " + colorCards);
            processedCombinaisons.push(new Combinaison(COMBINAISONS.COLOR, colorCards));
        }
        if (brelans.length > 0){
            let brelanCards = this.getCardsByValue(player, brelans[0]);
            console.log("Brelans : " + brelanCards);
            processedCombinaisons.push(new Combinaison(COMBINAISONS.BRELAN, brelanCards));
        }
        if (paires.length >= 2){
            let paire1Cards = this.getCardsByValue(player, paires[0]);
            let paire2Cards = this.getCardsByValue(player, paires[1]);
            console.log("Double paires : " + paire1Cards + ", " + paire2Cards);
            processedCombinaisons.push(new Combinaison(COMBINAISONS.DOUBLE_PAIRE, null, 
                new Combinaison(COMBINAISONS.PAIRE, paire1Cards),
                new Combinaison(COMBINAISONS.PAIRE, paire2Cards)));
        } else if (paires.length == 1 ){
            let paireCards = this.getCardsByValue(player, paires[0]);
            console.log("Paires : " + paireCards);
            processedCombinaisons.push(new Combinaison(COMBINAISONS.PAIRE, paireCards));
        }
        higthestCard = this.getCardsByValue(player, higthestCard)[0];
        console.log("Carte la plus haute : " + higthestCard);
        processedCombinaisons.push(new Combinaison(COMBINAISONS.HIGHTEST, higthestCard));
        
        if (processedCombinaisons.length > 1){
            processedCombinaisons.sort((a,b) => {
                let comparaison = 0;
            
                if (a.isStrongerThan(b)){
                    comparaison = -1;
                }
                else if (b.isStrongerThan(a)){
                    comparaison = 1;
                }

                return comparaison;
            });
        }
        player.combinaisons.BEST = processedCombinaisons[0];
        player.kickers = this.getKickers(player.cards, player.combinaisons.BEST);
        player.combinaisons.HIGHTEST = new Combinaison(COMBINAISONS.HIGHTEST, higthestCard);

        return player;
    }

    this.getWinners = function(){
        logger.info(MODULE_NAME, "Determination des vainqeurs");
        let players = [];
        let winners = [];
        
        for (var indexPlayer in otherPlayersCards){
            this.calculateCombinaisons(otherPlayersCards[indexPlayer]);
            players.push(otherPlayersCards[indexPlayer]);
            logger.info(MODULE_NAME, "Meilleure combinaison : " + otherPlayersCards[indexPlayer].combinaisons.BEST);
        }

        players.sort((a,b) => {
            let comparaison = 0;
        
            if (a.combinaisons.BEST.isStrongerThan(b.combinaisons.BEST, true)){
                comparaison = -1;
            }
            else if (b.combinaisons.BEST.isStrongerThan(a.combinaisons.BEST, true)){
                comparaison = 1;
            }

            return comparaison;
        });

        winners.push(players[0]);
        console.log(players[0].name + " a la meilleure combinaison " + players[0].combinaisons.BEST);
        
        for (var i = 1; i < players.length; i++){
            if (players[i].combinaisons.BEST.isSameStrength(players[0].combinaisons.BEST, true)){
                winners.push(players[i]);
                console.log(players[i].name + " a la meme combinaison....");
            }
        }
        console.log(winners);

        return winners;
    }
}

module.exports = GameRules;