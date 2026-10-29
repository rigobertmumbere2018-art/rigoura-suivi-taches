SERVICE D'ENVOI E-MAIL — RIGOURA SUIVI DES TÂCHES

Pourquoi ce service est nécessaire
Le logiciel fonctionne hors connexion, mais l'envoi d'e-mails exige Internet. Le fichier HTML ne contient aucun mot de passe. Ce service reçoit la liste des tâches, génère un vrai fichier Excel .xlsx, puis l'envoie aux deux adresses configurées dans le code.

Destinataires fixes :
- Rigobertmumbere2018@gmail.com
- Ourebiaccessible@gmail.com

Déploiement (Render ou autre hébergeur Node.js)
1. Déployer le dossier email-service comme service Web Node.
2. Commande de build : npm install
3. Commande de démarrage : npm start
4. Définir les variables d'environnement du fichier .env.example dans le tableau de bord privé de l'hébergeur.
5. BACKUP_API_TOKEN doit être un jeton long et aléatoire.
6. Pour Gmail, active la validation en deux étapes et crée un mot de passe d'application. Utilise ce mot de passe d'application comme SMTP_PASS, jamais ton mot de passe Gmail habituel.
7. L'adresse SMTP_USER doit autoriser l'envoi depuis ce compte.
8. Copie l'URL HTTPS du service et le BACKUP_API_TOKEN dans le bouton « Configurer l’e-mail » du logiciel.

Fonctionnement
- À chaque clic sur « Sauvegarder les données », le logiciel télécharge une copie CSV compatible avec Excel et une copie JSON restaurable.
- Il met la demande d'e-mail en file d'attente localement.
- Si le service est configuré et Internet disponible, le service envoie un fichier Excel .xlsx aux deux destinataires.
- Si Internet ou le service est indisponible, la demande reste en attente et est réessayée tant que l'application reste ouverte et lorsqu'elle retrouve la connexion.
- Le bandeau d'état affiche réussite, attente ou erreur.

Sécurité
- Les identifiants SMTP restent côté serveur, jamais dans le HTML.
- L'API exige un jeton d'accès et limite le nombre de requêtes.
- Ne partage pas le jeton avec des personnes non autorisées.
- Le service n'est pas encore opérationnel tant qu'il n'a pas été déployé et configuré avec un compte d'envoi.

Note : une application ne peut pas envoyer de mail pendant que l'ordinateur est éteint ou que le logiciel est fermé. Les sauvegardes en attente sont retentées à la prochaine ouverture/connexion.
