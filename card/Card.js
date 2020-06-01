// Doit être défini à l'identique dans Combinaison
const SAME_STRENGTH = 0;
const STRONGER = 1;
const WEAKER = -1;

function Card(valueCard, valueCardIndex, colorCard, colorCardIndex){
    let value = valueCard;
    let valueIndex = valueCardIndex;
    let color = colorCard;
    let colorIndex = colorCardIndex;

    this.getValue = function(){
        return value;
    }

    this.getColor = function(){
        return color;
    }

    this.getValueIndex = function(){
        return valueIndex;
    }

    this.getColorIndex = function(){
        return colorIndex;
    }


    this.compareStrength = function(other){
        if (other != null){
            if (other.getValueIndex() == valueIndex){
                // console.log("Same value : value (" + valueIndex + ") => other (" + other.getValueIndex() + ")");
                return SAME_STRENGTH;
            }
            else if (other.getValueIndex() > valueIndex){
                // console.log("Other value is stronger : value (" + valueIndex + ") => other (" + other.getValueIndex() + ")");
                return WEAKER;
            }
            else {
                // console.log("Value is stronger : value (" + valueIndex + ") => other (" + other.getValueIndex() + ")");
            }
        }
        return STRONGER;
    }


    this.isSameThan = function(other){
        return this.isSameStrength(other)
        && other.colorIndex == colorIndex;
    }

    this.isSameStrength = function(other){
        return this.compareStrength(other) == SAME_STRENGTH;
    }

    this.isStrongerThan = function(other){
        return this.compareStrength(other) == STRONGER;
    }

    this.toString = function(){
        return "{ " + value + " of " + color + " }"
    }

    this.getInformationsJSON = function(){
        return {
            "value" : value,
            "valueIndex" : valueIndex,
            "color" : color,
            "colorIndex" : colorIndex
        };
    }
}

module.exports = Card;