# Activation des comptes Rigoura Suivi des tâches

L'application utilise Firebase Authentication et Cloud Firestore pour fournir une authentification réelle et séparer les tâches par compte. Les paramètres Firebase du navigateur sont des identifiants publics de projet, pas des mots de passe.

## 1. Créer le projet Firebase
1. Ouvrir https://console.firebase.google.com/ et créer un projet.
2. Dans **Authentication > Sign-in method**, activer **E-mail/Password**.
3. Dans **Firestore Database**, créer la base de données en mode production.
4. Dans les paramètres du projet, ajouter une application Web et récupérer les valeurs `apiKey`, `authDomain`, `projectId` et `appId`.

## 2. Publier les règles de sécurité
Dans **Firestore Database > Rules**, remplacer les règles par le contenu du fichier `firestore.rules` de ce dépôt et publier.
L'adresse administrateur initiale prévue par ces règles est **rigobertmumbere2018@gmail.com**. Le premier compte créé avec cette adresse obtient le statut administrateur automatiquement. Les autres comptes restent en attente jusqu'à leur approbation depuis la page Administration.

## 3. Configurer l'application
Dans l'application, ouvrir **Connexion > Configuration technique**, renseigner les quatre valeurs de l'application Web Firebase et enregistrer. Faire cette configuration sur chaque appareil utilisé (ordinateur et téléphone).

## 4. Comptes et données
- Les inscriptions utilisent une adresse e-mail et un mot de passe d'au moins 8 caractères.
- L'administrateur approuve ou suspend les comptes.
- Chaque compte actif ne peut lire et modifier que ses propres tâches dans Firestore.
- Lors de la première connexion de l'administrateur, les tâches locales présentes sur cet appareil sont importées dans son espace si son espace distant est vide.
- Les anciennes données Google Sheets ne sont pas automatiquement partagées entre les nouveaux comptes. Conserver la feuille existante comme archive pendant la migration.

## Important
La configuration Firebase et la publication des règles doivent être effectuées dans la console du propriétaire du projet. Le dépôt contient le code et les règles, mais ne peut pas créer le projet Firebase ni publier des règles à la place du propriétaire.
