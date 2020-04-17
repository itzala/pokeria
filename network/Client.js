function Client(confServer, playerInstance){

    const MODULE_NAME = "Client";

    let logger = null;
    const hostServer = confServer.host;
    const portServer = confServer.port;
    const namespace = confServer.namespacePlayer;
    let io = require('socket.io-client');
    let socket = null;
    let player = playerInstance;
            

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }


    this.init = function(){
        logger.info(MODULE_NAME, "Initialisation du client");
    }

    this.connect = function(){
        const url = hostServer + ':' + portServer + '/' + namespace;
        logger.info(MODULE_NAME, "Connexion du client au serveur ("+ url +")");
        socket = io.connect(url, {reconnect : true});
        //console.log(socket);
        socket.on('connect', function(){
            logger.info(MODULE_NAME, "Client connecte au serveur. Envoi des infos pour la presentation");
        
            socket.emit('presentation-infos', {infos : player.getInfosPresentation()});
        });

        socket.on('connexion-success', function(data){
            logger.info(MODULE_NAME, "Connexion acceptee, mise a jour du client");
            player.setInfos(data.infos.details);
        });

        socket.on('get-ready-player', function(){
            logger.info(MODULE_NAME, "Confirmation que l'on est pret");
            socket.emit('ready-player', {});
        })

        
        socket.on('connexion-error', function(data){
            logger.info(MODULE_NAME, "Connexion refusee, mise a jour du client");
            console.log(data);
            this.close();
        });

        socket.on('disconnect', function(){
            logger.info(MODULE_NAME, "Deconnexion depuis le serveur... Arret du client");
            process.kill(process.pid, 'SIGINT');
        });
    }

    this.close = function(){
        logger.info(MODULE_NAME, "Deconnexion du client au serveur");
        socket.close();
    }
}

module.exports = Client;
