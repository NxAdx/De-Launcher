/**
 * Expo Config Plugin: withLauncherIntent
 *
 * Modifies AndroidManifest.xml to add:
 * 1. HOME and DEFAULT intent categories to the main activity
 * 2. AccessibilityService registration for the Distraction Engine
 * 3. Required permissions
 */
const { withAndroidManifest } = require("expo/config-plugins");

function addPermissions(androidManifest) {
  if (!androidManifest.manifest["uses-permission"]) {
    androidManifest.manifest["uses-permission"] = [];
  }

  const requiredPermissions = [
    "android.permission.QUERY_ALL_PACKAGES",
    "android.permission.BIND_ACCESSIBILITY_SERVICE",
    "android.permission.BIND_APPWIDGET",
  ];

  for (const perm of requiredPermissions) {
    const hasPermission = androidManifest.manifest["uses-permission"].some(
      (p) => p.$?.["android:name"] === perm
    );
    if (!hasPermission) {
      androidManifest.manifest["uses-permission"].push({
        $: { "android:name": perm },
      });
    }
  }

  return androidManifest;
}

function addLauncherIntentFilter(androidManifest) {
  const mainApplication = androidManifest.manifest.application?.[0];
  if (!mainApplication) {
    console.warn("withLauncherIntent: No application found in AndroidManifest");
    return androidManifest;
  }

  const mainActivity = mainApplication.activity?.find(
    (activity) => activity.$?.["android:name"] === ".MainActivity"
  );

  if (!mainActivity) {
    console.warn("withLauncherIntent: No MainActivity found");
    return androidManifest;
  }

  // Find or create the intent-filter with MAIN action
  let intentFilter = mainActivity["intent-filter"]?.find((filter) =>
    filter.action?.some(
      (action) => action.$?.["android:name"] === "android.intent.action.MAIN"
    )
  );

  if (!intentFilter) {
    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    }
    intentFilter = {
      action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
      category: [],
    };
    mainActivity["intent-filter"].push(intentFilter);
  }

  if (!intentFilter.category) {
    intentFilter.category = [];
  }

  // Add HOME category if not present
  const hasHome = intentFilter.category.some(
    (cat) => cat.$?.["android:name"] === "android.intent.category.HOME"
  );
  if (!hasHome) {
    intentFilter.category.push({
      $: { "android:name": "android.intent.category.HOME" },
    });
  }

  // Add DEFAULT category if not present
  const hasDefault = intentFilter.category.some(
    (cat) => cat.$?.["android:name"] === "android.intent.category.DEFAULT"
  );
  if (!hasDefault) {
    intentFilter.category.push({
      $: { "android:name": "android.intent.category.DEFAULT" },
    });
  }

  return androidManifest;
}

function addAccessibilityService(androidManifest) {
  const mainApplication = androidManifest.manifest.application?.[0];
  if (!mainApplication) return androidManifest;

  if (!mainApplication.service) {
    mainApplication.service = [];
  }

  const hasService = mainApplication.service.some(
    (s) => s.$?.["android:name"] === "expo.modules.delaunchernative.DistractionService"
  );

  if (!hasService) {
    mainApplication.service.push({
      $: {
        "android:name": "expo.modules.delaunchernative.DistractionService",
        "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: [
            { $: { "android:name": "android.accessibilityservice.AccessibilityService" } },
          ],
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.accessibilityservice",
            "android:resource": "@xml/accessibility_service_config",
          },
        },
      ],
    });
  }
  return androidManifest;
}

module.exports = function withLauncherIntent(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addPermissions(config.modResults);
    config.modResults = addLauncherIntentFilter(config.modResults);
    config.modResults = addAccessibilityService(config.modResults);
    return config;
  });
};
