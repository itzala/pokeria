# pokeria
Projet nodejs d'une ia de poker

# Dépendances

Ce projet nodejs utilise les dépendances suivantes : 
- Le framework **Express** pour la gestion de la partie Client - Serveur
- La librairie **minimist** pour la gestion des arguments en ligne de commande
- La librairie **socket.io** pour la gestion des sockets utilisées pour la communication entre la partie Client - Serveur - IHM
- La librairie **system-sleep** pour la gestion des délais

# Installation de pokeria

Pour installer les dépendances une fois le dépôt cloner, faire 
```
    npm install
```

# Fichiers de configuration

Tous les fichiers de configuration se trouvent dans le dossier conf : 
- **properties.json** : contient toute la configuration du serveur et de l'application (url et port du serveur, niveau de logs, etc...)
- **players.json** : contient la liste des joueurs (le nom notamment)
- **poker.json** : contient toutes les informations sur les cartes (valeurs, couleurs), les combinaisons, les stades de jeu, etc..

# Mode croupier

Pour lancer le croupier : 
```
    node pokeria.js --type=croupier
```

# Mode joueur

Pour lancer le joueur numéro X : 
``` 
    node pokeria.js --type=player --numero=X
```

/!\ Le joueur numéro X doit exister dans le fichier conf/players.json

Pour lancer l'IHM :
- Lancer le croupier
- Se connecter sur http://localhost:9080 (url et port par défaut défini dans le fichier conf/properties.json)

# Licence 

Apache License