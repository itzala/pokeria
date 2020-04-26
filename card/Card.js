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

    this.isSameThan = function(other){
        return other.valueIndex == valueIndex
        && other.colorIndex == colorIndex;
    }

    this.isStrongerThan = function(other){
        return other.valueIndex < valueIndex;
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