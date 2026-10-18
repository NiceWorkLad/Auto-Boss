#!/usr/bin/env bash
# Builds the Android app: the game (npm run build), copies it into the Android project (cap sync) and
# runs Gradle. Usage: tools/android.sh [debug|release|install]
#   debug    android/app/build/outputs/apk/debug/app-debug.apk (default)
#   release  a signed bundle for Google Play (needs android/keystore.properties, see README)
#   install  builds debug and installs it on the phone adb can see
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-$HOME/opt/jdk21}" ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
node build.js
npx cap sync android
cd android
case "${1:-debug}" in
  debug)   ./gradlew -q assembleDebug && ls -lh app/build/outputs/apk/debug/app-debug.apk ;;
  release) ./gradlew -q bundleRelease && ls -lh app/build/outputs/bundle/release/app-release.aab ;;
  install) ./gradlew -q installDebug ;;
  *) echo "usage: tools/android.sh [debug|release|install]"; exit 1 ;;
esac
