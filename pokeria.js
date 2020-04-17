const confDir = __dirname + '/conf';
const conf = require(confDir + '/properties.json');

const Logger = require(__dirname + '/logger/Logger');

const TYPE = {CROUPIER : 'croupier', PLAYER : 'player'};
let launchedType = '';

let logFile = require('path').resolve(__dirname + '/' + conf.log.logDir);
const MODULE_NAME = 'POKERIA';

function usage(isCroupier = true, isPlayer = true){
    let message = "Usage : \n";
    message += "============\n";
    message += "Pour avoir l'aide, lancer la commande : \n";
    message += "\tnode" + __filename + " --help OU node" + __filename + " --h\n";
    message += "============\n";
    if (isCroupier){
        message += "Pour lancer le croupier, lancer la commande : \n";
        message += "\tnode" + __filename + " --type=croupier\n";
        message += "============\n";
    }
    if (isPlayer){
        message += "Pour lancer le player, lancer la commande : \n";
        message += "\tnode" + __filename + " --type=player --numero=[X]\n";
        message += "\t\t=> X represente le numero du joueur, doit etre compris entre 1 et " + conf.nbMaxPlayer+ "\n";
        message += "============";
    }
    
    console.log(message);
    process.exit(-1);
}

function terminate(code){
    component.close();
    logger.info(MODULE_NAME,'Code retour recu : ' + code);
    logger.info(MODULE_NAME,'========================== Fin du programme PokerIA - ' + launchedType + ' ==========================');
    process.exit(0);
}

// on vérifie le nombre d'arguments utiles
const nbArgs = process.argv.slice(2).length;
if (nbArgs == 0){
    usage();
}
// on récupère à partir du 3 ième argument
const args = require('minimist')(process.argv.slice(2));
if (args['help'] !== undefined || args['h'] !== undefined){
    console.log("Affichage de l'aide");
    usage();
}

if (args['type'] == undefined || args['type'] === true){
    console.log("L'option 'type' n'est pas definie");
    usage(true, true);
}

if (!args['type'].trim()){
    console.log("L'option 'type' est vide...");
    usage(true, true);
}

let component = null;

switch(args['type'].toLowerCase()){
    case TYPE.CROUPIER :
        logFile += '/' + conf.log.file_croupier;
        const Croupier = require(__dirname + '/croupier/Croupier');
        component = new Croupier(conf.nbMaxPlayer);
        launchedType = TYPE.CROUPIER;
        break;
    case TYPE.PLAYER :
        
        if (args['numero'] == undefined || args['numero'] === true){
            console.log("Le numero du joueur n'est pas defini...");
            usage(false, true);
        }

        const Player = require(__dirname + '/player/Player');
        const confPlayers = require(confDir + '/players.json');
        let numberPlayer = parseInt(args['numero']) - 1;
        if (numberPlayer < 0 || numberPlayer > confPlayers.list.length){
            console.log("Le numero du joueur n'est pas valide");
            usage(false, true);
        }
        component = new Player(confPlayers.list[numberPlayer]);
        
        launchedType = TYPE.PLAYER;
        logFile += '/' + conf.log.file_player.replace('NUM_PLAYER', numberPlayer + 1);
        break;
    default :
        console.log("Le type de programme n'est pas reconnu...");
        usage();
        break;
}

var logger = new Logger(logFile, conf.log.debug);
logger.info(MODULE_NAME,'========================== Debut du programme PokerIA - ' + launchedType + ' ==========================');
component.setLogger(logger);
component.init(conf);
component.launch();

process.on('SIGTERM', function(code){
    terminate(code);
});

process.on('SIGINT', function(code){
    terminate(code);
})