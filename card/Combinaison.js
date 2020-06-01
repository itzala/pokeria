const configuration = require('../conf/poker.json');
const COMBINAISONS = configuration.combinaisons;

// Doit être défini à l'identique dans Card
const SAME_STRENGTH = 0;
const STRONGER = 1;
const WEAKER = -1;

function Combinaison(kindCombinaison, cardsCombinaison, subcombi1 = null, subcombi2 = null){

    let kind = kindCombinaison;
    let isAlreadySorted = false;
    let cards = null;
    let subcombinaison1 = subcombi1;
    let subcombinaison2 = subcombi2;
    
    if (cardsCombinaison != null) {
        cards = cardsCombinaison instanceof Array ? cardsCombinaison : new Array(cardsCombinaison);
    }

    this.getNbNeededKickers = function(){
        return 5 - this.getNbCards();
    }

    this.getNbCards = function(){
        if (cards != null){
            return cards.length;
        }
        else if (subcombinaison1 != null && subcombinaison2 != null) {
            return subcombinaison1.getNbCards() + subcombinaison2.getNbCards();
        }
        return 0;
    }

    this.getStrength = function(){
        return kind.strength;
    }

    this.toString = function(){
        let message = "{";
        message += kind.name
        message += "}"
        return message;
    }

    this.getCards = function(){
        if (cards != null){
            return cards;
        }
        else if (subcombinaison1 != null && subcombinaison2 != null){
            return subcombinaison1.getCards().concat(subcombinaison1.getCards());
        }
        return null;
    }

    this.compareStrength = function(other, debug = false){
        if (debug){
            console.log("Comparaison de combinaisons " );
        }
        
        if (other != null){
            // console.log("L'autre combinaison n'est pas nulle " );
            if (this.getStrength() < other.getStrength()){
                // console.log("L'autre a une plus grande puissance" );
                return WEAKER;
            } 
            else if (this.getStrength() == other.getStrength()) {
                // console.log("Puissance egale" );
                let bestCard = null;
                let otherBestCard = null;
                let comparedStrengthCard = SAME_STRENGTH;
                let i = 0;
                do{
                    bestCard = this.getBestCard(i);
                    otherBestCard = other.getBestCard(i);
                    if (debug){
                        console.log("Meilleure carte : " + bestCard.toString() + " / Autre meilleure carte : " + otherBestCard.toString());
                    }
                    
                    comparedStrengthCard = bestCard.compareStrength(otherBestCard);
                    if (debug){
                        console.log("Resultat de la comparaison (SAME_STRENGTH = 0 / STRONGER = 1 / WEAKER = -1) : " + comparedStrengthCard);
                    }
                    i++;
                } while (comparedStrengthCard == SAME_STRENGTH && i < this.getNbCards());
                return (i == this.getNbCards()) ? SAME_STRENGTH : comparedStrengthCard;
            }
        }
        return STRONGER;
    }

    this.getBestCard = function(index = 0){
        if (cards != null){
            if (kind.isSortable && ! isAlreadySorted){
                cards.sort((a,b) => {
                    let comparaison = 0;

                    if (a.strength > b.strength){
                        comparaison = -1;
                    }
                    else if (a.strength < b.strength){
                        comparaison = 1;
                    }

                    return comparaison;
                });
                isAlreadySorted = true;
            }
            return cards[index];
        }
        else if (subcombinaison1 != null && subcombinaison2 != null) {
            if (index < subcombinaison1.getNbCards()){
                return subcombinaison1.getBestCard(index % subcombinaison1.getNbCards());
            }
            else {
                return subcombinaison2.getBestCard(index % subcombinaison1.getNbCards());
            }

        }
        return null;
    }

    this.isStrongerThan = function(other, debug = false){
        return this.compareStrength(other, debug) == STRONGER;
    }

    this.isSameStrength = function(other, debug = false){
        return this.compareStrength(other, debug) == SAME_STRENGTH;
    }
}

module.exports = Combinaison;