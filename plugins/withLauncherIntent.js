/**
 * Expo Config Plugin: withLauncherIntent
 *
 * Modifies AndroidManifest.xml to add:
 * 1. HOME and DEFAULT intent categories to the main activity
 * 2. AccessibilityService registration for the Distraction Engine
 * 3. Required permissions
 */
const { withAndroidManifest, withAndroidStyles } = require("expo/config-plugins");

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

function addQueries(androidManifest) {
  if (!androidManifest.manifest.queries) {
    androidManifest.manifest.queries = [];
  }

  const hasLauncherQuery = androidManifest.manifest.queries.some(
    (q) => q.intent && q.intent.some(
      (i) => i.action?.[0]?.$?.["android:name"] === "android.intent.action.MAIN" &&
             i.category?.[0]?.$?.["android:name"] === "android.intent.category.LAUNCHER"
    )
  );

  if (!hasLauncherQuery) {
    androidManifest.manifest.queries.push({
      intent: [
        {
          action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
          category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
        },
      ],
    });
  }

  // Add queries for all standard icon pack themes to guarantee visibility on Android 11+
  const iconPackActions = [
    "org.adw.launcher.THEMES",
    "com.novalauncher.THEME",
    "com.anddoes.launcher.THEME",
    "com.teslacoilsw.launcher.THEME",
    "com.fede.launcher.THEME_ICONPACK",
    "com.gau.go.launcherex.theme",
    "com.dlto.atom.launcher.THEME",
    "solo.launcher.THEME"
  ];

  for (const actionName of iconPackActions) {
    const hasActionQuery = androidManifest.manifest.queries.some(
      (q) => q.intent && q.intent.some(
        (i) => i.action?.[0]?.$?.["android:name"] === actionName
      )
    );

    if (!hasActionQuery) {
      androidManifest.manifest.queries.push({
        intent: [
          {
            action: [{ $: { "android:name": actionName } }],
          },
        ],
      });
    }
  }

  // Add queries for Settings so DistractionService can resolve and whitelist them on Android 11+
  const settingsActions = [
    "android.settings.SETTINGS",
    "android.settings.ACCESSIBILITY_SETTINGS",
    "android.settings.HOME_SETTINGS",
    "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
  ];

  for (const actionName of settingsActions) {
    const hasActionQuery = androidManifest.manifest.queries.some(
      (q) => q.intent && q.intent.some(
        (i) => i.action?.[0]?.$?.["android:name"] === actionName
      )
    );

    if (!hasActionQuery) {
      androidManifest.manifest.queries.push({
        intent: [
          {
            action: [{ $: { "android:name": actionName } }],
          },
        ],
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

function addWallpaperTheme(styles) {
  if (!styles.resources.style) {
    return styles;
  }
  
  const appTheme = styles.resources.style.find(
    (style) => style.$?.name === "AppTheme"
  );

  if (appTheme) {
    if (!appTheme.item) {
      appTheme.item = [];
    }

    const hasShowWallpaper = appTheme.item.some((item) => item.$?.name === "android:windowShowWallpaper");
    if (!hasShowWallpaper) {
      appTheme.item.push({
        $: { name: "android:windowShowWallpaper" },
        _: "true",
      });
    }

    const hasWindowBackground = appTheme.item.some((item) => item.$?.name === "android:windowBackground");
    if (!hasWindowBackground) {
      appTheme.item.push({
        $: { name: "android:windowBackground" },
        _: "@android:color/transparent",
      });
    } else {
      const bgItem = appTheme.item.find((item) => item.$?.name === "android:windowBackground");
      if (bgItem) {
        bgItem._ = "@android:color/transparent";
      }
    }
  }

  return styles;
}

module.exports = function withLauncherIntent(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addPermissions(config.modResults);
    config.modResults = addQueries(config.modResults);
    config.modResults = addLauncherIntentFilter(config.modResults);
    config.modResults = addAccessibilityService(config.modResults);
    return config;
  });
  
  config = withAndroidStyles(config, (config) => {
    config.modResults = addWallpaperTheme(config.modResults);
    return config;
  });

  return config;
};
