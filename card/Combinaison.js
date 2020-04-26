function Combinaison(kindCombinaison, cardsCombinaison, subcombi1 = null, subcombi2 = null){
    let kind = kindCombinaison;
    let cards = cardsCombinaison;
    let subcombinaison1 = subcombi1;
    let subcombinaison2 = subcombi2;
    let extremeCards = {};

    // Trie par ordre décroissant : c > b > a
    this.sortCardsByStrength = function(a, b){
        let comparaison = 0;

        if (a.strength > b.strength){
            comparaison = -1;
        }
        else if (a.strength < b.strength){
            comparaison = 1;
        }

        return comparaison;
    }

    this.getExtremeCards = function(){
        return extremeCards;
    }

    this.setExtremeCards = function(){
        let sortedCards = null;
        if (cards != null){
            sortedCards = cards.sort(this.sortCardsByStrength);
            extremeCards.LOW = cards[cards.length - 1];
            extremeCards.HIGHT = cards[0];
        }
        else {
            let extremeCardsSub1 = subcombinaison1.getExtremeCards();
            let extremeCardsSub2 = subcombinaison2.getExtremeCards();
            if (extremeCardsSub1.HIGHT.isGreaterThan(extremeCardsSub2.HIGHT)){
                extremeCards.HIGHT = extremeCardsSub1.HIGHT;
            }
            else {
                extremeCards.HIGHT = extremeCardsSub2.HIGHT;
            }
            if (extremeCardsSub1.LOW.isGreaterThan(extremeCardsSub2.LOW)){
                extremeCards.LOW = extremeCardsSub2.LOW;
            }
            else {
                extremeCards.LOW = extremeCardsSub1.LOW;
            }
        }
        return extremeCards;
    }

    this.isStrongerThan = function(other){
        if (other == null){
            return true;
        }
        let extremeCardsOther = other.getExtremeCards();
        let extremeCardsSub2 = this.getExtremeCards();
        if (extremeCardsSub1.HIGHT.isGreaterThan(extremeCardsSub2.HIGHT)){
            extremeCards.HIGHT = extremeCardsSub1.HIGHT;
        }
        else {
            extremeCards.HIGHT = extremeCardsSub2.HIGHT;
        }
        if (extremeCardsSub1.LOW.isGreaterThan(extremeCardsSub2.LOW)){
            extremeCards.LOW = extremeCardsSub2.LOW;
        }
        else {
            extremeCards.LOW = extremeCardsSub1.LOW;
        }
    }

    this.toString = function(){
        return "{ " + kind + ", extremes cards : LOW " + extremeCards.LOW + " / HIGHT " + extremeCards.HIGHT + " }"
    }
}

module.exports = Combinaison;