const Client = require('../network/Client');

function Player(data){
    const MODULE_NAME = "Player";
    const name = data["name"];
    let tokens = data["tokens"];
    let position = 0;
    let seat = 0;
    let rank = 0;
    let state = null;
    let cards = [];
    let socketID = null;

    let client = null;

    let logger = null;
        

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }

    this.toString = function(){

        return 'Player : {"Name" : ' + name + ', "tokens" : ' + tokens + '}';
    }

    this.checkPoint = function(message, step){
        const readLine = require('readline').createInterface({
            input : process.stdin,
            output : process.stdout
        });

        readLine.question(message, userResponse => {            
            logger.info(MODULE_NAME, "Passer checkpoint - " + step + " ? : " + userResponse);
            readLine.close();
        });
    }

    this.init = function(conf){
        if (logger == 'undefined'){
            console.log("ERROR : Logger non defini !");
            process.exit(-1);
        }
        logger.info(MODULE_NAME, "Initialisation du " + MODULE_NAME + ' ' + this.getName());
        client = new Client(conf.server, this);
        client.setLogger(logger);
        
    }
    
    this.launch = function(){
        logger.info(MODULE_NAME, "Lancement du  " + MODULE_NAME);
        //this.checkPoint('Appuyer sur une touche pour lancer la connexion...', 'CONNEXION CLIENT');
        client.connect();
    }

    this.close = function(){
        logger.info(MODULE_NAME, "Arret du  " + MODULE_NAME);
        client.close();
    }

    this.getName = function(){
        return name;
    }

    this.getInfosPresentation = function(){
        return {
            "name" : name,
            "tokens" : tokens,
            "socketID" : socketID
        }
    }

    this.setPosition = function(newPosition){
        position = newPosition;
    }

    this.getPosition = function(){
        return position;
    }

    this.getSocketID = function(){
        return socketID;
    }

    this.setSocketID = function(id){
        socketID = id;
    }

    this.setTokens = function(countTokens){

    }

    this.setInfos = function(data){
        tokens = data["tokens"];
        position = data['position'];
        seat = data["seat"];
        rank = data["rank"];
        state = data["state"];
        socketID = data['socketID'];
        cards = data['cards'];
        logger.info(MODULE_NAME, "Mise a jour des informations recues : " + JSON.stringify(data));
    }
}

module.exports = Player;