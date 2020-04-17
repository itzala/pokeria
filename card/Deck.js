const Card = require('./Card');

function Deck(colors, cardsByColor){
    const MODULE_NAME = "Deck";
    let logger = null;
    let cards = null;

    const COLORS = colors;
    const VALUES = cardsByColor;

    this.setLogger = function(loggerInstance){
        logger = loggerInstance;
    }
    this.init = function(){
        cards = [];
        let newCard = null;
        logger.info(MODULE_NAME, 'Generation des cartes....');
        for (var c = 0; c < COLORS.length; c++){
            for (var v = 0; v < VALUES.length; v++){
                newCard = new Card(VALUES[v],v, COLORS[c], c);
                cards.push(newCard);
            }
        }
    }

    this.shuffle = function(){
        logger.info(MODULE_NAME, 'Melange des cartes....');
        // Utilisation de l'algorithme de Fisher-Yates
        for (var i = cards.length - 1; i> 0; i--){
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = cards[i];
            cards[i] = cards[j];
            cards[j] = tmp;
        }
        //loggerlogger.info(MODULE_NAME, 'Cartes melangees : ' + this.cards.toString());
    }

    this.getNexCard = function(){
        return cards.shift();
    }
}

module.exports = Deck;