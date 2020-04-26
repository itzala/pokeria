const Server = require('../network/Server');
const PlayerServer = require('./PlayerServer');
const GameRules = require('../card/GameRules');
const sleep = require('system-sleep');

function Croupier(nbPlayers){
    const MODULE_NAME = "Croupier";
    const nbMaxPlayers = nbPlayers;
    let server = null;
    let logger = null;
    let players = [];
    let currentPlayer = null;
    let currentStep = null;
    let countTokensStart = 0;
    let gameRules = null;
    let availableSeats = [];
    let nbReadyPlayers = 0;
    let STEPS = null;

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }

    this.initAvailableSeats = function(){
        for (var i = 0; i < nbMaxPlayers; i++){
            availableSeats[i] = true;
        }
    }

    this.changeAvailableSeat = function(seatNumber, available){
        availableSeats[seatNumber] = available;
    }

    this.getFirstAvailableSeat = function(){
        for (var i = 0; i < nbMaxPlayers; i++){
            if (availableSeats[i]){
                return i;
            }
        }
        return nbMaxPlayers;
    }

    this.init = function(conf){
        if (logger == 'undefined'){
            console.log("ERROR : Logger non defini !");
            process.exit(-1);
        }
        countTokensStart = conf.countTokensStart;
        logger.info(MODULE_NAME, "Initialisation du " + MODULE_NAME);
        server = new Server(conf, this);
        server.setLogger(logger);
        server.init();
        gameRules = new GameRules();
        gameRules.setLogger(logger);
        gameRules.init();
        STEPS = gameRules.getSteps();
        currentStep = gameRules.getCurrentStepGame();
        this.initAvailableSeats();
    }

    this.getCurrentStepGame = function(){
        return gameRules.getCurrentStepGame();
    }

    this.launch = function(){
        logger.info(MODULE_NAME, "Lancement du  " + MODULE_NAME);
        server.open();
    }

    this.close = function(){
        logger.info(MODULE_NAME, "Arret du  " + MODULE_NAME);
        server.close();
    }


    this.sortPlayersByTokens = function(a, b){
        let comparaison = 0;

        if (a.tokens > b.tokens){
            comparaison = 1;
        }
        else if (a.tokens < b.tokens){
            comparaison = -1;
        }

        return comparaison * -1;
    }

    this.updateRank = function(){
        
        let data = [];

        // trier les éléments par nombre de tokens
        let playersRank = players.map(function(e, i){
            return {index : i, tokens : e.getTokens()};
        });

        playersRank.sort(this.sortPlayersByTokens);

        // recalcule le rang dans le classement à partir du nombre de tokens
        playersSortedRank = playersRank.map(function(e, i){
            players[e.index].setRank(i + 1);
            data.push(players[e.index].getInfos());
            return players[e.index];
        });

        server.updateScoreBoard(data);
    }

    this.addPlayer = function(dataPlayer){
        
        let result = {
            status : "",
            isAccepted : false,
            message : ""
        };
        
        logger.info(MODULE_NAME, "Connexion du joueur " + dataPlayer['name'] + "... Lancement des verifications d'usage");
        if (players.length >= nbMaxPlayers){
            logger.error(MODULE_NAME, "Nombre maximal de joueur deja atteint");
            result.status = "error";
            result.message = "La table est deja complete. Merci de reessayer plus tard";
        }
        else if (this.hasAlreadyJoined(dataPlayer['socketID'], dataPlayer['name'])){
            logger.error(MODULE_NAME, "Le joueur " + dataPlayer['name'] + " est deja autour de la table");
            result.status = "error";
            result.message = "La table est deja complete. Merci de reessayer plus tard";
        }
        else{
            if (players.length == 0){
                logger.debug(MODULE_NAME, "Premier joueur a se connecter");
                this.updateStepGame(false, true);
            }

            dataPlayer['position'] = players.length + 1;
            dataPlayer["seat"] = this.getFirstAvailableSeat() + 1;
            dataPlayer["rank"] = players.length + 1;
            dataPlayer["state"] = "ALIVE";

            let newPlayer = new PlayerServer(dataPlayer);
            players.push(newPlayer);
            result.isAccepted = true;
            result.status = "success";
            result.message = "Bienvenue a la table";
            this.changeAvailableSeat(dataPlayer["seat"] - 1, false);
            result.details = newPlayer.getInfos();
            this.updateRank();
        }

        return result;
    }

    this.removePlayer = function(playerID){
        let index = this.getIndexPlayer(playerID);
        let result = {
            status : false
        }
        if (index != -1){
            result.status = true;
            result.playerName  = players[index].getName();
            result.socketID = players[index].getSocketID();
            logger.info(MODULE_NAME, "Deconnexion du joueur " + result.playerName);
            this.changeAvailableSeat(players[index].getSeat() - 1, true);
            players.splice(index, 1);
            nbReadyPlayers--;
            this.updateRank();
        }
        else {
            logger.info(MODULE_NAME, "Pas de joueur trouve avec l'id " + playerID);
        }
        return result;
    }


    this.getIndexPlayer = function(playerID, playerName = ""){
        for (var i = 0; i < players.length; i++){
            if (players[i].getName() == playerName || players[i].getSocketID() == playerID){
                return i;
            }
        }
        return -1;
    }

    this.getPlayer = function(playerID, playerName = ""){
        let index = this.getIndexPlayer(playerID, playerName);
        if (index != -1){
            return players[index];
        }
        return null;
    }

    this.hasAlreadyJoined = function(playerID, playerName = ""){
        return this.getPlayer(playerID, playerName) != null;
    }

    this.updateStepGame = function(isForClient = true, isForIHM = true){
        logger.info(MODULE_NAME, "Changement de l'état du jeu");
        gameRules.changeStepGame();
        server.updateStepGame(gameRules.getCurrentStepGame(), isForClient, isForIHM);
    }

    this.getReadyPlayer = function(){

        this.updateStepGame(false, true);
        server.getReadyPlayer();
    }

    this.playerReady = function(playerID){
        let player = this.getPlayer(playerID);
        logger.info(MODULE_NAME, "Distribution des jetons");
        player.setTokens(countTokensStart + (player.getPosition() - 1));
        server.giveTokens(countTokensStart + (player.getPosition() - 1), player.getSocketID());
        nbReadyPlayers++;
        server.playerReady(playerID);
        if (nbReadyPlayers == players.length){
            logger.info(MODULE_NAME, "Tous les joueurs sont prets !");
            this.updateRank();
            this.updateStepGame();
        }
    }

    this.giveCard = function(isBurned = false, player = null){
        let newCard = gameRules.getNextCard(isBurned);
        if (player != null){
            logger.debug(MODULE_NAME, "Nouvelle carte : '" + newCard.toString() + "' pour le joueur " + player.getName() );
            player.addCardToHand(newCard);
        }
        else {
            logger.debug(MODULE_NAME, "Nouvelle carte : '" + newCard.toString() + "' sur la table" );
            for (var i = 0; i < players.length; i++){
                players[i].addCardToTable(newCard);
            }
        }
        server.giveCard(newCard, player);
    }

    this.startGame = function(){
        logger.info(MODULE_NAME, "Debut de la partie");
        this.updateStepGame();
        logger.info(MODULE_NAME, "Distribution des cartes de depart");
        let nbTurns = 2 * players.length; // on donne 2 cartes à chaque joueur
        for (let i = 0; i < nbTurns; i++){
            this.giveCard(false, players[(i +1) % players.length]); // on commence par le joueur "petite blinde"
            sleep(1000);    // on ajoute du délai pour voir les animations sur l'IHM
        }
        logger.info(MODULE_NAME, "Fin de  la distribution des cartes de depart");
        // FLOP
        sleep(5000);
        this.nextTurn();
        // TURN
        sleep(5000);
        this.nextTurn();
        // RIVER
        sleep(5000);
        this.nextTurn();
        // Détermination du gagnant
        sleep(5000);
        this.nextTurn();
        // Fin de partie
        sleep(3000);
        this.nextTurn();
    }

    this.sortPlayersByPosition = function(a, b){
        let comparaison = 0;

        if (a.getPosition() > b.getPosition()){
            comparaison = 1;
        }
        else if (a.getPosition() < b.getPosition()){
            comparaison = -1;
        }

        return comparaison;
    }


    this.updatePositions = function(){
        let newPosition = -1;
        for (var i = 0; i < players.length; i++){

            if (players[i].getPosition() == 1){
                newPosition = players.length;
            } else 
            {
                newPosition = players[i].getPosition() - 1;
            }

            players[i].setPosition(newPosition);
            server.updatePosition(players[i]);
        }

        players.sort(this.sortPlayersByPosition);
    }

    this.startNewGame = function(){
        server.resetCards();
        for (var i = 0; i < players.length; i++){
            players[i].resetCards();
        }
        gameRules.startNewRound();
        this.updatePositions();
        sleep(2000);
        this.startGame();
    }

    this.checkWinner = function(){
        logger.info(MODULE_NAME,"Determination des vainqueurs....");
        for (var i = 0; i < players.length; i++){
            gameRules.addCardsOtherPlayer(players[i]);
        }
        let winners = gameRules.getWinners();
        server.updateWinners(winners);
    }

    this.nextTurn = function(){
        this.updateStepGame();
        currentStep = gameRules.getCurrentStepGame();
        logger.info(MODULE_NAME, "Tour suivant : " + currentStep.message);
        switch (currentStep.name){
            case STEPS.FLOP.name :
                this.giveCard(true);
                for (var i = 0; i < 2; i++){
                    sleep(1000); // on ajout du délai pour voir les animations sur l'IHM
                    this.giveCard();
                }
            break;
            case STEPS.TURN.name :
                this.giveCard(true);
            break;
            case STEPS.RIVER.name :
                this.giveCard(true);
            break;
            case STEPS.CHECK_WINNER.name : 
                this.checkWinner();
            break;
            case STEPS.END_ROUND.name : 
                server.endTurn();
            break;
        }
    }
}

module.exports = Croupier;