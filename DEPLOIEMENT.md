# TOUVOIR — Déploiement Web, GitHub et Android

Ce document décrit la publication reproductible du projet existant :

- **Web** : site statique HTML/CSS/JavaScript construit dans `www/`, hébergé par Vercel ;
- **Android** : même interface encapsulée avec Capacitor 8, identifiant `ci.touvoir.app` ;
- **Backend** : Supabase TOUVOIR existant (REST public limité par RLS + fonction Edge `notify-lead`) ;
- **Code source et releases Android** : GitHub + GitHub Actions.

## Adresses de production

- Site Vercel : https://touvoir.vercel.app
- Dépôt GitHub : https://github.com/Leroy1096/touvoir (public — code du site vitrine, aucun secret)
- Dernière release Android : https://github.com/Leroy1096/touvoir/releases (voir `v1.0`)

## Prérequis

- Node.js 22 ou supérieur ;
- npm ;
- JDK 21 pour Android ;
- Android SDK 36 et Build-Tools 36 pour compiler localement ;
- Git.

## Commandes locales

Installer les dépendances :

```bash
npm ci
```

Vérifier le JavaScript et construire le site public :

```bash
npm run check:js
npm run build
```

Le dossier `www/` est généré ; il ne doit pas être commité.

Servir le build local :

```bash
npm run serve:web
```

Synchroniser Android et compiler un APK debug :

```bash
npm run android:debug
```

APK produit :

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Publication GitHub initiale

Créer un dépôt GitHub vide nommé par exemple `touvoir`, sans README, licence ni `.gitignore` générés par GitHub, puis relier le dépôt local :

```bash
git remote add origin https://github.com/<compte-ou-organisation>/touvoir.git
git push -u origin main
```

Avec GitHub CLI, après `gh auth login` :

```bash
gh repo create touvoir --private --source=. --remote=origin --push
```

Utilisez `--public` uniquement si le code doit être visible par tout le monde. La clé Supabase présente dans le navigateur est une clé publishable, mais aucun secret serveur ne doit être ajouté au dépôt.

## Vercel

Le projet Vercel existant est `touvoir`, avec le domaine `touvoir.vercel.app`.

Dans Vercel :

1. ouvrir le projet `touvoir` ;
2. `Settings` → `Git` → connecter le dépôt GitHub ;
3. choisir la branche de production `main` ;
4. vérifier :
   - Framework Preset : `Other` / aucun framework ;
   - Install Command : `npm ci` ;
   - Build Command : `npm run build` ;
   - Output Directory : `www` ;
5. lancer un déploiement de production.

Ces réglages sont également versionnés dans `vercel.json`. Après connexion Git, chaque push sur `main` déclenche le déploiement de production et chaque pull request peut recevoir un aperçu Vercel.

Variables Vercel déjà prévues (publiques uniquement) :

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Le site actuel lit sa configuration publique dans `assets/js/supabase-config.js`. Ne placez jamais `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` ou un mot de passe de base de données dans Vercel pour ce site statique.

## Android — signature release

La signature release est lue uniquement depuis l’environnement :

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Le keystore et ses mots de passe ne doivent jamais être commités. Conservez-les hors ligne et dans un gestionnaire de mots de passe.

Build release local :

```bash
export ANDROID_KEYSTORE_PATH="/chemin/hors-depot/touvoir-release.keystore"
export ANDROID_KEYSTORE_PASSWORD="…"
export ANDROID_KEY_ALIAS="touvoir-release"
export ANDROID_KEY_PASSWORD="…"
npm run cap:sync
cd android
./gradlew assembleRelease bundleRelease
```

Sorties :

```text
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

### Secrets GitHub Actions

Dans GitHub : `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

Créer :

| Secret | Contenu |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Keystore encodé en Base64, sur une seule ligne |
| `ANDROID_KEYSTORE_PASSWORD` | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | Alias de la clé, par exemple `touvoir-release` |
| `ANDROID_KEY_PASSWORD` | Mot de passe de la clé |

Encoder le keystore sous Linux/macOS :

```bash
base64 -w 0 touvoir-release.keystore > keystore-base64.txt
```

Sous Windows PowerShell :

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("touvoir-release.keystore")) | Set-Content keystore-base64.txt
```

Copiez le contenu dans le secret, puis supprimez le fichier temporaire. Ne partagez pas ce fichier Base64 publiquement : il permet de reconstruire le keystore.

## Publier une nouvelle version Android

1. Mettre à jour `version` dans `package.json`.
2. Mettre à jour `versionName` et incrémenter `versionCode` dans `android/app/build.gradle`.
3. Tester :

   ```bash
   npm ci
   npm run check:js
   npm run android:debug
   ```

4. Commiter et pousser :

   ```bash
   git add .
   git commit -m "release: TOUVOIR vX.Y.Z"
   git push origin main
   ```

5. Créer et pousser le tag :

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

Le workflow `.github/workflows/android.yml` compile alors l’APK/AAB signés et les attache à la GitHub Release. Un build release sans publication peut aussi être lancé manuellement depuis l’onglet `Actions` avec l’option `build_release`.

## Supabase et application Android

La fonction Edge `notify-lead` doit autoriser les origines Capacitor :

```text
https://localhost,http://localhost,capacitor://localhost
```

Elles peuvent être fournies par le secret Supabase `LEAD_ALLOWED_ORIGINS` et sont également présentes dans le code source de la fonction. Les autres secrets restent uniquement dans Supabase.

## Contrôles après publication

- ouvrir chaque page publique et actualiser le navigateur ;
- vérifier un formulaire de test sans envoyer de production abusive ;
- contrôler les liens WhatsApp, téléphone, e-mail et Google Maps ;
- installer l’APK release sur un téléphone Android réel ;
- vérifier les formulaires dans l’APK avec connexion Internet ;
- contrôler le bouton Retour Android ;
- vérifier qu’aucun keystore, APK, `.env` ou secret n’apparaît dans `git status`.

## Dépannage

### Gradle manque de mémoire

Utiliser un seul worker et une JVM plus légère :

```bash
./gradlew assembleRelease --no-daemon --max-workers=1 -Dorg.gradle.jvmargs='-Xmx1024m -Dfile.encoding=UTF-8'
```

### Le build release est non signé

Une ou plusieurs variables `ANDROID_KEYSTORE_*` / `ANDROID_KEY_*` sont absentes. Le workflow GitHub échoue volontairement et nomme le secret manquant.

### Vercel publie une ancienne version

Vérifier que le projet est connecté au bon dépôt/branche et que le dernier commit est bien sur `main`. Le build doit produire `www/` avec `npm run build`.
