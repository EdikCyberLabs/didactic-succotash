#!/usr/bin/env bash
# Construit l'APK Android de PixelBudget sans Gradle ni SDK complet.
#
# Outils requis (Ubuntu/Debian) :
#   sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 openjdk-17-jdk
#
# Signature :
#   - par défaut, une clé de test est créée dans android/pixelbudget-test.keystore (non versionnée) ;
#   - pour une vraie publication, fournir sa propre clé :
#       KEYSTORE=/chemin/release.jks KEY_ALIAS=pixelbudget KEYSTORE_PASS=... ./android/build-apk.sh
#
# Résultat : dist/PixelBudget-<version>.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
DX="${DX:-dalvik-exchange}"
VERSION="$(node -p "require('$ROOT/package.json').version")"
VERSION_CODE="${VERSION_CODE:-$(echo "$VERSION" | awk -F. '{ print $1 * 10000 + $2 * 100 + $3 }')}"
MIN_SDK=23
TARGET_SDK=34

KEYSTORE="${KEYSTORE:-$ROOT/android/pixelbudget-test.keystore}"
KEY_ALIAS="${KEY_ALIAS:-pixelbudget}"
KEYSTORE_PASS="${KEYSTORE_PASS:-pixelbudget-test}"

BUILD="$ROOT/android/build"
DIST="$ROOT/dist"
APK="$DIST/PixelBudget-$VERSION.apk"

for tool in aapt javac "$DX" zipalign apksigner keytool node; do
  command -v "$tool" >/dev/null || { echo "Outil manquant : $tool (voir l'en-tête de ce script)" >&2; exit 1; }
done
[ -f "$ANDROID_JAR" ] || { echo "android.jar introuvable : $ANDROID_JAR" >&2; exit 1; }

echo "→ PixelBudget $VERSION (versionCode $VERSION_CODE)"
rm -rf "$BUILD"
mkdir -p "$BUILD/assets/www" "$BUILD/classes" "$BUILD/dex" "$DIST"

# 1. Application web embarquée (uniquement ce qui est servi au navigateur).
cp "$ROOT/index.html" "$BUILD/assets/www/"
cp -r "$ROOT/src" "$BUILD/assets/www/src"

# 2. Code Java → bytecode Java 8 → dex.
javac -source 8 -target 8 -Xlint:-options -encoding UTF-8 \
  -bootclasspath "$ANDROID_JAR" -d "$BUILD/classes" \
  $(find "$ROOT/android/java" -name '*.java')
"$DX" --dex --min-sdk-version="$MIN_SDK" --output="$BUILD/dex/classes.dex" "$BUILD/classes"

# 3. Manifeste + ressources + assets → APK non signé, puis ajout du dex.
aapt package -f \
  -M "$ROOT/android/AndroidManifest.xml" \
  -S "$ROOT/android/res" \
  -A "$BUILD/assets" \
  -I "$ANDROID_JAR" \
  --min-sdk-version "$MIN_SDK" --target-sdk-version "$TARGET_SDK" \
  --version-code "$VERSION_CODE" --version-name "$VERSION" \
  -F "$BUILD/unsigned.apk"
(cd "$BUILD/dex" && aapt add -k "$BUILD/unsigned.apk" classes.dex >/dev/null)

# 4. Alignement + signature (schémas v1/v2/v3).
zipalign -f -p 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  echo "→ Création d'une clé de test : $KEYSTORE"
  keytool -genkeypair -noprompt -keystore "$KEYSTORE" -storetype PKCS12 \
    -alias "$KEY_ALIAS" -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=PixelBudget Test, O=PixelBudget, C=FR" >/dev/null 2>&1
fi
apksigner sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEYSTORE_PASS" --key-pass "pass:$KEYSTORE_PASS" \
  --min-sdk-version "$MIN_SDK" --out "$APK" "$BUILD/aligned.apk"
apksigner verify "$APK"

echo "✔ $APK ($(du -h "$APK" | cut -f1))"
