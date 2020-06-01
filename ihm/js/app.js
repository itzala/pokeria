$(document).ready(function(){

    function getBackCard(){
        var card = $('<div></div>');
        card.prop('class', 'card back');
        card.text('*');
        return card;
    }

    function getJokerCard(){
        var card = $('<div></div>');
        card.prop('class', 'card little joker')
        var rankCard = $('<span></span>').text('-');
        rankCard.prop('class', 'rank');
        var suitCard = $('<span></span>').text('Joker');
        suitCard.prop('class', 'suit');
        card.append(rankCard);
        card.append(suitCard);       
        return card;
    }

    function getCard(valueIndex, colorIndex){

        // Doit correspondre aux classes de la librairie CSS
        // Doit être déclaré dans le même ordre que dans le fichier de configuration
        const SUITS = ['hearts', 'diams', 'clubs', 'spades'];
        const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a' ]

        let rank = RANKS[valueIndex];
        let suit = SUITS[colorIndex];
        
        var card = $('<div></div>');
        card.prop('class', 'card rank-'+ rank.toLowerCase() + ' ' + suit)
        var rankCard = $('<span></span>').text(rank.toUpperCase());
        rankCard.prop('class', 'rank');
        var suitCard = $('<span></span>').html('&'+suit+';');
        suitCard.prop('class', 'suit');
        card.append(rankCard);
        card.append(suitCard);       
        return card;
    }


    function updateNbConnectedPlayers(){
        $('.nbConnectedPlayers').text(players.length);
    }

    function addCard(player, card){
        let newCard = getCard(card.valueIndex, card.colorIndex);
        let liCard = $('<li></li>');
        liCard.append(newCard);
        $('#croupier-deck li').last().remove();
        if (player != null){
            updateHistoricAera(player.name + " vient de recevoir la carte {" + card.value + " of " + card.color + "}");
            $('#hand-seat-' + player.seat).append(liCard);
        }
        else {
            $('#tableCardsList').append(liCard);
            updateHistoricAera("La carte {" + card.value + " of " + card.color + "} est placée sur la table");
        }
    }
    
    function addPlayerScoreboard(infos){
        var scoreboard = $('#classement');
        var newPlayerScoreboard = $('<div></div>');
        var top = '';
        if (infos.rank > 0 && infos.rank < 4){
            top = ' top'+infos.rank;
        }
        newPlayerScoreboard.prop('class', 'scoringRank' + top);
        newPlayerScoreboard.prop('id', 'rank-' + infos.rank);
        var rank = $('<p></p>').text(infos.rank);
        rank.prop('class', 'positionRank');
        var playerNameRank = $('<p></p>').text(infos.name);
        playerNameRank.prop('class', 'playerNameRank');
        var tokensRank = $('<p></p>').text(infos.tokens);
        playerNameRank.prop('class', 'tokensRank');
        newPlayerScoreboard.append(rank);
        newPlayerScoreboard.append(playerNameRank);
        newPlayerScoreboard.append(tokensRank);
        scoreboard.append($('<li></li>').append(newPlayerScoreboard));
    }
    
    function updatePositionPlayer(positionPlayer, position){
        switch (position){
            case 1 :
                positionPlayer.addClass('position-dealer');
                positionPlayer.text('D');
                break
            case 2:
                positionPlayer.addClass('position-little-blind');
                positionPlayer.text('LB');
                break;
            case 3 : 
                positionPlayer.addClass('position-big-blind');
                positionPlayer.text('BB');
                break;
            default :
                positionPlayer.addClass('position-player');
                positionPlayer.text('SP');
            break;

        }
    }

    function addNewPlayer(infos, isSynchronize = false){
        var newPlayer = $('<div></div>');
        newPlayer.prop('id', 'seat-' + infos.seat) ;
        newPlayer.prop('class', 'player');
        newPlayer.append($('<h4></h4>').text('- Siège ' + infos.seat + ' - '));
        newPlayer.append($('<h5></h5>').text(infos.name));
        var handPlayer = $('<div></<div>');
        handPlayer.prop('class', 'playingCards faceImages');
        var listCards = $('<ul></ul>');
        listCards.prop('id', "hand-seat-" + infos.seat);
        listCards.prop('class', "hand");
        handPlayer.append(listCards);
        var handContainer = $('<div></div>');
        handContainer.prop('class', 'handContainer');
        handContainer.append(handPlayer);
        newPlayer.append(handContainer);
        if (isSynchronize){
            infos.cards = JSON.parse(infos.cards);
        }
        
        console.log(infos);
        console.log(infos.cards);
        console.log(infos.cards.length);
        if (infos.cards.length > 0){
            for(var card in infos.cards){
                console.log("Ajout des cartes ?");
                if (infos.cards.length <= 2){
                    addCard(infos, card);
                }
                else {
                    addCard(null, card);
                }
                
            }
        }
        var detailsPlayer = $('<div></div>');
        detailsPlayer.prop('class', 'detailsPlayer');
        detailsPlayer.append($('<p></p>').html('Jetons : <span class="tokensPlayer" id="tokens-seat-' + infos.seat + '">' + infos.tokens + '</span>'));
        var positionPlayer = $('<div></div>');
        positionPlayer.prop('class', 'position');
        positionPlayer.prop('id', 'position-seat-' + infos.seat);

        updatePositionPlayer(positionPlayer, infos.position);
        
        detailsPlayer.append(positionPlayer);
        newPlayer.append(detailsPlayer);

        // TODO : Modifier ici pour adapater selon le nombre de joueurs maximal
        switch(infos.seat){
            case 1 :
                console.log('Le joueur est à placer dans la zone : .playersAreaLeft');
                $('.playersAreaLeft').append(newPlayer);
                break;
            case 2 :
                console.log('Le joueur est à placer dans la zone : .playersAreaTop');
                $('.playersAreaTop').prepend(newPlayer);
                break;
            case 3 : 
                console.log('Le joueur est à placer dans la zone : .playersAreaTop');
                $('.playersAreaTop').append(newPlayer);
                break;
            case 4 :
                console.log('Le joueur est à placer dans la zone : .playersAreaTop');
                $('.playersAreaTop').append(newPlayer);
                break;
            case 5 :
                console.log('Le joueur est à placer dans la zone : .playersAreaRight');
                $('.playersAreaRight').append(newPlayer);
                break;
        }

        setStatePlayer(infos.seat, infos.state);

        players.push(infos);
        // addPlayerScoreboard(infos);
        updateNbConnectedPlayers();
    }
    
    function removePlayer(infos){
        var index = -1;
        var seat = -1;
        var rank = -1;
        var name = "";
        for (var i = 0; i < players.length; i++){
            if (players[i].socketID == infos.socketID){
                index = i;
                seat = players[i].seat;
                rank = players[i].rank;
                name = players[i].name;
                break;
            }
        }
        if (index >= 0){
            updateHistoricAera(name + ', qui était positioné(e) sur le siège ' + seat + ', vient de quitter la table');
            players.splice(index, 1);
            console.log(players);
            $('#seat-' + seat).remove();
        
            updateNbConnectedPlayers();
        }
    }
    
    function updateHistoricAera(actionMessage){
        if (verbose){
            const dateOptions = {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
                };
            const now = new Date();
            const dateAction = new Intl.DateTimeFormat('fr-FR', dateOptions).format(now);
            var newLiMessage = $('<li></li>');
            var newMessage = newLiMessage.append($('<p></p>').html("<span class='heureAction'> " + dateAction + "</span> " + actionMessage));
            $('#historiqueListe').append(newMessage);
        }
    }

    function manageButtons(){
        switch(currentStep.name){
            case "WAITING_PLAYERS" :
                $('#getReadyButton').hide();
                $('#startGameButton').hide();
                $('#startNewGameButton').hide();
                $('#reinitializeGameButton').hide();
                break;
            case "CONNEXION_PLAYERS" :
                $('#getReadyButton').show();
                $('#startGameButton').hide();
                $('#startNewGameButton').hide();
                $('#reinitializeGameButton').show();
                break;
            case "READY_PLAYERS" :
                $('#getReadyButton').hide();
                $('#startGameButton').show();
                $('#startNewGameButton').hide();
                $('#reinitializeGameButton').show();
                break;
            case "END_ROUND" :
                $('#getReadyButton').hide();
                $('#startGameButton').hide();
                $('#startNewGameButton').show();
                $('#reinitializeGameButton').show();
                break;
            default:
                break;
        }
    }
    
    function getIndexPlayer(playerID, playerName = ""){
        for (var i = 0; i < players.length; i++){
            if (players[i].name == playerName || players[i].socketID == playerID){
                return i;
            }
        }
        return -1;
    }

    function getPlayer(playerID, playerName = ""){
        let index = getIndexPlayer(playerID, playerName);
        if (index != -1){
            return players[index];
        }
        return null;
    }

    function updateStepGame(){
        var stepGame = $('#step');
        updateHistoricAera("Passage à l'étape du jeu : " + currentStep.message);
        stepGame.text(currentStep.message);
    }

    function buildDeck(nbMaxPlayers, isFirstGame = true){
        const nbCards = 2 * nbMaxPlayers + 3 + 1 + 1;
        console.log('Le deck du croupier doit contenir ' + nbCards + ' cartes');
        if (isFirstGame) {
            $('#croupier-deck').append($('<li></li>').append(getJokerCard()));
        }
        for (var i = 0; i < nbCards; i++){
            $('#croupier-deck').append($('<li></li>').append(getBackCard()));
        }
    }

    function setStatePlayer(seat, state = "ALIVE"){
        // $('#seat-' + seat).addClass('ready');
        switch (state) {
            case "READY" :
                $('#seat-' + seat).addClass('ready');
            break;
            case "WINNER" : 
                $('#seat-' + seat).addClass('winner');
            break;
            case "FOLDED" :
                $('#seat-' + seat).addClass('folded');
            break;
            case "OUT" :
                $('#seat-' + seat).addClass('out');
            break;
        }
    }
    
    let socket = io("/ihm");
    socket.emit('connexion-ihm', {});
    let players = [];
    let nbReadyPlayers = 0;
    let currentStep = null;
    let verbose = true;
    
    socket.on('configuration-ihm', function(data){
        $('#nbMaxPlayers').text(data.infos.nbMaxPlayers);
        currentStep = data.infos.currentStep;
        updateStepGame();
        buildDeck(data.infos.nbMaxPlayers);
    });
    
    socket.on('synchronize-ihm', function(data){
        let infos = data.infos;
        updateHistoricAera("Resynchronisation de l'IHM.. Historique précédent perdu....");
        currentStep = infos.currentStep;
        verbose = false;
        updateStepGame();
        
        let nbCardsDeck = data.infos.nbMaxPlayers;
        buildDeck(nbCardsDeck);
        manageButtons();

        for (let i = 0; i < infos.players.length; i++) {
            addNewPlayer(infos.players[i], true);
        }
        
        verbose = true;
    });

    socket.on('connexion-player', function(data){
        if (players.length == 0){
            $('#getReadyButton').prop('disabled', false);   
        }
        addNewPlayer(data.infos);
        updateHistoricAera("Le joueur " + data.infos.name + " (" + data.infos.socketID + ") vient de se connecter à la table");
    });
    
    socket.on('deconnexion-player', function(data){
        removePlayer(data.infos);
    });

    socket.on('update-step', function(data){
        currentStep = data.infos.currentStep;
        updateStepGame();
        manageButtons();
        // $("#progressBar").css("animation", "progressStepMove 20s");
    });

    socket.on('give-tokens', function(data){
        if (data.infos.playerID != null){
            var updatedPlayer = getPlayer(data.infos.playerID);
            $('#tokens-seat-' + updatedPlayer.seat).text(data.infos.tokens)
            updateHistoricAera("Le joueur " + updatedPlayer.name + " vient de recevoir " +  data.infos.tokens + " jetons");
        }
        else {
            console.log('Error lors de la distribution des jetons. Données reçus :  ' + data);
        }
    });

    socket.on('give-card', function(data){
        
        let player = null;

        if (data.infos.playerID != ''){
            player = getPlayer(data.infos.playerID);
        }
        addCard(player, data.infos.card);
    });

    socket.on('ready-player', function(data){        
        var readyPlayer = getPlayer(data.infos.socketID);
        if (readyPlayer != null){
            updateHistoricAera(readyPlayer.name + " est prêt...");
            nbReadyPlayers++;
            setStatePlayer(readyPlayer.seat, "READY");
            $('#nbReadyPlayers').text(nbReadyPlayers);
        }
    });

    socket.on('update-scoreboard', function(data){
        let playersScoreboard = data.infos.players;
        // console.log("UPDATE SCOREBOARD EVENT : ");
        // console.log(data.infos.players);
        $('#classement li').remove();
        for (var i = 0; i < playersScoreboard.length; i ++){
            addPlayerScoreboard(playersScoreboard[i]);
        }
    });

    socket.on('update-winners', function(data){
        updateHistoricAera("Les vainqueurs ont été déterminés....");
        console.log('winners');
        console.log(data.infos.winners);
    });

    socket.on('end-turn', function(){
        updateHistoricAera("Fin de la manche");
        manageButtons();
        // $('#startNewGameButton').show();
    });

    socket.on('update-position', function(data){
        let positionPlayer =  $('#position-seat-' + data.infos.seat);
        positionPlayer.removeClass();
        positionPlayer.addClass('position');
        updatePositionPlayer(positionPlayer, data.infos.position);
    });

    $('#reinitializeGameButton').click(function(event){
        event.preventDefault();
        updateHistoricAera("Réinitialisation de la partie");
    });


    // $('#initIHMButton').click(function(event){
    //     event.preventDefault();
    //     updateHistoricAera("Initialisation de l'IHM");
    //     $('#getReadyButton').show();
    //     $('#getReadyButton').prop('disabled', true);
    //     // $('#startGameButton').show();
    //     $('#initIHMButton').hide();
    //     socket.emit('initialize-ihm', {});
    // });

    $('#getReadyButton').click(function(event){
        event.preventDefault();
        if (players.length > 0) {
            updateHistoricAera("Vérification de la dispo des joueurs...");
            socket.emit('get-ready-player', {});
            // $('#getReadyButton').hide();
            // $('#startGameButton').prop('disabled', false);
            // $('#startGameButton').show();
        }
    });

    $('#startGameButton').click(function(event){
        event.preventDefault();
        updateHistoricAera("Tous les joueurs sont prêts... La partie peut être lancée");
        socket.emit('start-game', {});
        // $('#startGameButton').prop('disabled', true);
        // $('#startGameButton').hide();
        // $('#nextTurnButton').show();
    });

    $('#nextTurnButton').click(function(event){
        event.preventDefault();
        socket.emit('next-turn', {});
    });

    $('#startNewGameButton').click(function(event){
        event.preventDefault();
        updateHistoricAera("Lancement d'une nouvelle partie");
        // $('#startNewGameButton').hide();
        $('#tableCardsList li').remove();
        // on passe false en deuxième argument pour ne pas rajouter le joker lors de la "reconstruction" du deck pour la nouvelle partie
        buildDeck($('#nbMaxPlayers').text(), false);
        for (var i = 0; i < players.length; i++){
            $('#hand-seat-' + players[i].seat + ' li').remove();
        }
        socket.emit('start-new-game', {});
    });
});
