# Activation des comptes — Rigoura Suivi des tâches

Le projet Firebase utilisé par l'application est déjà intégré au code publié sur GitHub Pages.

- Projet Firebase : `rigoura-suivi-des-taches`
- Domaine d'authentification : `rigoura-suivi-des-taches.firebaseapp.com`
- Région Firestore : `africa-south1`
- Administrateur initial : `rigobertmumbere2018@gmail.com`

## 1. Vérifier la méthode de connexion

Dans la console Firebase, ouvrir **Authentication > Méthode de connexion** et vérifier que **Adresse e-mail/Mot de passe** est activé.

## 2. Autoriser le domaine GitHub Pages

Dans **Authentication > Paramètres > Domaines autorisés**, ajouter :

`rigobertmumbere2018-art.github.io`

Sans ce domaine, Firebase Authentication peut refuser les connexions depuis le site publié.

## 3. Publier les règles Firestore

Dans **Cloud Firestore > Règles** :
1. Ouvrir le fichier `firestore.rules` de ce dépôt.
2. Copier tout son contenu.
3. Le coller dans l'éditeur de règles de Firestore.
4. Cliquer sur **Publier**.

**Attention :** enregistrer le fichier dans GitHub ne publie pas automatiquement les règles dans Firebase. Cette étape doit être faite dans la console Firebase du projet.

Les règles autorisent chaque membre actif à accéder uniquement à ses propres tâches. L'administrateur peut consulter les comptes et les approuver ou les suspendre.

## 4. Créer le compte administrateur

Ouvrir l'application et créer le compte avec l'adresse administrateur indiquée ci-dessus. Ce compte reçoit le rôle administrateur automatiquement. Les autres inscriptions restent en attente jusqu'à leur approbation depuis la page **Administration**.

## 5. Tester l'application

Après publication des règles et autorisation du domaine :
1. Recharger l'application.
2. Se connecter avec le compte administrateur.
3. Créer un compte de collaborateur avec une autre adresse.
4. Approuver ce compte depuis **Administration**.
5. Se connecter avec le compte collaborateur et vérifier qu'il ne voit que ses propres tâches.

## Données historiques

Les anciennes données Google Sheets ne sont pas automatiquement transférées dans les comptes des collaborateurs. Lors de la première connexion de l'administrateur, les tâches locales présentes sur son appareil peuvent être importées dans son espace Firebase si celui-ci est vide. Conserver la feuille Google Sheets comme archive pendant la migration.
