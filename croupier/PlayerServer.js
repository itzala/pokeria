function PlayerServer(data){
    const MODULE_NAME = "Player";
    const name = data["name"];
    let tokens = data["tokens"];
    let position = data['position'];
    let seat = data["seat"];
    let rank = data["rank"];
    let state = data["state"];
    let socketID = data['socketID'];
    let cards = [];

    let logger = null;
        

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }

    this.toString = function(){
        return "";
    }

    this.getName = function(){
        return name;
    }

    this.setPosition = function(newPosition){
        position = newPosition;
    }

    this.getPosition = function(){
        return position;
    }

    this.setRank = function(newRank){
        rank = newRank;
    }

    this.getRank = function(){
        return rank;
    }

    this.getSocketID = function(){
        return socketID;
    }

    this.setTokens = function(newCountTokens){
        tokens = newCountTokens;
    }

    this.getTokens = function(){
        return tokens;
    }

    this.getSeat = function(){
        return seat;
    }

    this.giveTokens = function(deltaTokens){
        tokens += deltaTokens;
    }

    this.getInfos = function(){
        return {
            "name" : name,
            "tokens" : tokens,
            "position" : position,
            "seat" : seat,
            "rank" : rank,
            "state" : state,
            "socketID" : socketID,
            "cards" : cards,
        };
    }

    this.addCardToHand = function (card){
        cards.push(card);
    }

    this.addCardToTable = function(card){
        cards.push(card);
    }

    this.getCards = function(){
        return cards;
    }
}

module.exports = PlayerServer;