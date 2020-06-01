function Server(conf, croupierInstance){

    const MODULE_NAME = "Server";

    const express = require('express');
    let app = express();
    let http = require('http').Server(app);
    let io = require('socket.io')(http);
    let clientIO = io.of('/' + conf.server.namespacePlayer);
    let ihmIO = io.of('/' + conf.server.namespaceSpectator);
    
    let croupier = croupierInstance;

    const confServer = conf;
    const path = require('path');
    const ihmDir = path.resolve(__dirname + "/../" + conf.server.ihm.viewsDir);

    let logger = null;

    const STEPS = {WAITING_PLAYERS : 'WAITING_PLAYERS', READY : 'READY', PREFLOP : 'PREFLOP', FLOP :  'FLOP', TURN : 'TURN',
                    RIVER : 'RIVER', BID : 'BID', GIVING_CARDS : 'GIVING_CARDS', END_TURN :  'END_TURN', END_GAME : 'END_GAME'};
    
    let currentStep = STEPS.WAITING_PLAYERS;

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }

    this.initApi = function(){
        logger.info(MODULE_NAME, "Initialisation de l'API");
        clientIO.on('connection', function(socket){
            logger.info(MODULE_NAME, "Connexion d'un client");
            socket.on('presentation-infos', function(data){
                logger.info(MODULE_NAME, "Envoi d'une demande de presentation...");
                data.infos['socketID'] = socket.id;
                let result = croupier.addPlayer(data.infos);
                const eventName = "connexion-" + result.status;
                logger.info(MODULE_NAME, 'Client '+ socket.id +' accepte ? ' + result.status + " => Event a emettre : " + eventName);
                clientIO.to(`${socket.id}`).emit(eventName, {infos : result});
                logger.info(MODULE_NAME, 'Mise a jour du client avec les infos :  ' + JSON.stringify(result));

                if (result.status == "success"){
                    ihmIO.emit('connexion-player', {infos : result.details});
                }
            });

            socket.on('ready-player', function(){
                logger.info(MODULE_NAME, 'Le joueur ' + croupier.getPlayer(socket.id).getName() + ' a repondu qu\'il est pret....');

                croupier.playerReady(socket.id);
                
            });

            socket.on('disconnect', function(){
                logger.info(MODULE_NAME, "Deconnexion d'un client");
                

                let result = croupier.removePlayer(socket.id);


                if (result.status){
                    ihmIO.emit('deconnexion-player', {infos : {socketID : result.socketID, name : result.playerName}});
                }
            });
        });
    }

    this.initIHM = function(){
        logger.info(MODULE_NAME, "Initialisation de l'IHM");

        app.use('/static', express.static(ihmDir));

        app.get('/', function(req, res) {
            res.sendFile(ihmDir +'/index.html');
         });
        ihmIO.on('connection', function(socket){
            socket.on('connexion-ihm', function(){
                croupier.connexionSpectator();
            });


            socket.on('get-ready-player', function(){
                logger.info(MODULE_NAME, 'Verification de la dispo des joueurs....');
                croupier.getReadyPlayer();
            });

            socket.on('start-game', function(){
                logger.info(MODULE_NAME, 'Demarrage de la partie....');
                // clientIO.emit('update-step', {infos :  {
                //         "currentSte" : "GIVING_CARDS"
                //     }
                // });
                croupier.startGame();
            });

            socket.on('start-new-game', function(){
                croupier.startNewGame();
            });

            socket.on('disconnect', function(){
                // logger.info(MODULE_NAME, "Deconnexion de l'ihm");
            });

            socket.on('next-turn', function(){
                croupier.nextTurn();
            });
        });
    }

    this.init = function(){
        logger.info(MODULE_NAME, "Initialisation du serveur");

        this.initApi();
        this.initIHM();
    }

    this.initializeSpectator = function(currentStepGame){
        ihmIO.emit('configuration-ihm', {infos : {
            "nbMaxPlayers" : confServer.nbMaxPlayer,
            'currentStep' : currentStepGame               
        }});
    }

    this.synchronizeSpectator = function(data){
        ihmIO.emit('synchronize-ihm', {infos : data});
    }

    this.updateStepGame = function(nextStepGame, isForclient = true, isForIHM = true){
        logger.info(MODULE_NAME, "Changement de l'etat du jeu : " + nextStepGame.name);
        if (isForclient){
            logger.debug(MODULE_NAME, "Dispatch vers les joueurs");
            clientIO.emit('update-step', {infos : {currentStep : nextStepGame}});
        }
        
        if (isForIHM){
            logger.debug(MODULE_NAME, "Dispatch vers l'IHM");
            ihmIO.emit('update-step', {infos : {currentStep : nextStepGame}});    
        }
    }

    this.updateScoreBoard = function(dataScoreboard){
        logger.info(MODULE_NAME, "Mise a jour du scoreboard");
        ihmIO.emit('update-scoreboard', {infos : {players : dataScoreboard}});
    }

    this.getReadyPlayer = function(){
        clientIO.emit('get-ready-player', {});
    }

    this.playerReady = function(playerID){
        ihmIO.emit('ready-player', {infos : {socketID : playerID}});
    }

    this.resetCards = function(){
        clientIO.emit('reset-cards', {});
    }

    this.endTurn = function(){
        clientIO.emit('end-turn', {});
        ihmIO.emit('end-turn', {});
    }

    this.updatePosition = function(player){
        ihmIO.emit('update-position', {infos : {
            seat : player.getSeat(),
            position : player.getPosition()
        }});
    }

    this.giveCard = function(card, player = null){
        let playerID = '';
        if (player == null){
            clientIO.emit('give-card', {infos : {'card' : card.getInformationsJSON(), 'type' : 'table'}});
        }
        else {
            playerID = player.getSocketID();
            clientIO.to(`${playerID}`).emit('give-card', {infos : {'card' : card.getInformationsJSON(), 'type' : 'personnelle'}});
        }
        ihmIO.emit('give-card', {infos : {
                'playerID' : playerID,
                'card' : card.getInformationsJSON()
            }
        });
    }

    this.giveTokens = function(countTokens, playerID = null){
        if (playerID == null){
            clientIO.emit('give-tokens', {tokens : countTokens});
        }
        else {
            clientIO.to(`${playerID}`).emit('give-tokens', {infos : {'tokens' : countTokens}});
        }
        ihmIO.emit('give-tokens', {infos : {
            'tokens' : countTokens, 
            'playerID' : playerID
            }
        });
    }

    this.updateWinners = function(winners){
        ihmIO.emit('update-winners', {infos : {
            'winners' : winners
        }});
    }

    this.open = function(){
        http.listen(confServer.server.port, () => {
            logger.info(MODULE_NAME, "Ecoute sur le port " + confServer.server.port);
        });
    }

    this.close = function(){
        logger.info(MODULE_NAME, "Arret du serveur");
        io.close(function(socket){
            socket.disconnect();
        });
        http.close();
    }
}

module.exports = Server;
