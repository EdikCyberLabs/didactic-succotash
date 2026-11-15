# Clé de signature de l'APK de test

`debug.keystore` est une clé de **débogage** (mots de passe publics `android`, alias `androiddebugkey`).
Le workflow `Android APK` la place en `~/.android/debug.keystore` pour que chaque version de l'APK
soit signée avec la même clé : une nouvelle version s'installe ainsi par-dessus la précédente,
sans désinstaller l'application ni perdre les données du téléphone.

Elle ne convient pas au Google Play Store. Pour publier sur le Play Store, créez une clé de version
gardée secrète (secrets GitHub Actions) et une compilation `assembleRelease` / `bundleRelease`.
