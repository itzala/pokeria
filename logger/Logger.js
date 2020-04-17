const fs = require('fs');

function Logger(log = 'app_default.log', verbosityLevel){
    let logFile = log;
    let verbosity = verbosityLevel;
    
    const LEVELS = {INFO : 'INFO', WARN : 'WARN', 
                    DEBUG : 'DEBUG', ERROR : 'ERROR',
                    CRITICAL : 'CRITICAL'};

    const date_options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
        };

    this.info = function(moduleName, message){
        this.writeLog(moduleName, LEVELS.INFO, message);
    }

    this.warn = function(moduleName, message){
        this.writeLog(moduleName, LEVELS.INFO, message);
    }

    this.debug = function(moduleName, message){
        this.writeLog(moduleName, LEVELS.DEBUG, message);
    }

    this.debugJson = function(moduleName, message, data){
        this.writeLog(moduleName, LEVELS.DEBUG, message + ' : ' + JSON.stringify(data));
    }

    this.error = function(moduleName, message){
        this.writeLog(moduleName, LEVELS.ERROR, message);
    }

    this.critical = function(moduleName, message){
        this.writeLog(moduleName, LEVELS.CRITICAL, message);
    }

    this.writeLog = function(moduleName, level, message){
        if (typeof message !== 'undefined'){
            const now = new Date();
            var messageFormatted = '[' + (moduleName + '.' + level).toUpperCase() +'] ' + new Intl.DateTimeFormat('fr-FR', date_options).format(now) + ' - ' + message;
            fs.appendFileSync(logFile, messageFormatted + '\n');
            if (verbosity){
                console.log(messageFormatted);
            }
        }
    }

    this.getVerbosityLevel = function(){
        return verbosity;
    }
}

module.exports = Logger;