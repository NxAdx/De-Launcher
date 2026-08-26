/**
 * Expo Config Plugin: withLauncherIntent
 *
 * Modifies AndroidManifest.xml to add:
 * 1. HOME and DEFAULT intent categories to the main activity
 * 2. AccessibilityService registration for the Distraction Engine
 * 3. Required permissions
 */
const { withAndroidManifest, withAndroidStyles, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

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
    "solo.launcher.THEME",
    "jp.co.a_tm.android.launcher.icons",
    "com.lge.launcher2.THEME",
    "ch.deletescape.lawnchair.ICONPACK"
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

function addPerformanceAttributes(androidManifest) {
  const application = androidManifest.manifest.application?.[0];
  if (application) {
    if (!application.$) application.$ = {};
    application.$["android:hardwareAccelerated"] = "true";
    application.$["android:largeHeap"] = "true";
  }
  return androidManifest;
}

module.exports = function withLauncherIntent(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addPermissions(config.modResults);
    config.modResults = addQueries(config.modResults);
    config.modResults = addLauncherIntentFilter(config.modResults);
    config.modResults = addAccessibilityService(config.modResults);
    config.modResults = addPerformanceAttributes(config.modResults);
    return config;
  });
  
  config = withAndroidStyles(config, (config) => {
    config.modResults = addWallpaperTheme(config.modResults);
    return config;
  });

  // Inject onNewIntent HOME press handler and 120Hz high refresh rate into MainActivity.kt
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android?.package || "com.nxadx.delauncher";
      const packagePath = packageName.replace(/\./g, "/");
      const mainActivityPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packagePath,
        "MainActivity.kt"
      );

      if (fs.existsSync(mainActivityPath)) {
        let contents = fs.readFileSync(mainActivityPath, "utf8");

        // 1. Inject enableHighRefreshRate() call in onCreate if missing
        if (!contents.includes("enableHighRefreshRate()")) {
          contents = contents.replace(
            "super.onCreate(null)",
            "super.onCreate(null)\n    enableHighRefreshRate()"
          );
        }

        // 2. Inject enableHighRefreshRate and onNewIntent methods if missing
        if (!contents.includes("fun enableHighRefreshRate")) {
          const highFpsCode = `
  private fun enableHighRefreshRate() {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
        val window = window ?: return
        val display = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
          display
        } else {
          @Suppress("DEPRECATION")
          windowManager.defaultDisplay
        }
        val modes = display?.supportedModes ?: return
        var maxRefreshRate = 60f
        var bestModeId = 0
        for (mode in modes) {
          if (mode.refreshRate > maxRefreshRate) {
            maxRefreshRate = mode.refreshRate
            bestModeId = mode.modeId
          }
        }
        if (bestModeId != 0) {
          val params = window.attributes
          params.preferredDisplayModeId = bestModeId
          window.attributes = params
        }
      }
    } catch (e: Exception) {
      android.util.Log.w("MainActivity", "Failed to set high refresh rate", e)
    }
  }`;

          const lastBraceIndex = contents.lastIndexOf("}");
          if (lastBraceIndex !== -1) {
            contents =
              contents.slice(0, lastBraceIndex) +
              highFpsCode +
              "\n}\n";
          }
        }

        if (!contents.includes("onNewIntent")) {
          const homeHandlerCode = `
  private var lastHomePressedTime = 0L

  override fun onNewIntent(intent: android.content.Intent?) {
      super.onNewIntent(intent)
      intent?.let {
          if (it.hasCategory(android.content.Intent.CATEGORY_HOME)) {
              val now = System.currentTimeMillis()
              // Debounce: only broadcast if >1200ms since last, to avoid killing
              // in-progress navigation transitions (e.g. pushing to /settings or /search)
              if (now - lastHomePressedTime > 1200) {
                  lastHomePressedTime = now
                  val localIntent = android.content.Intent("com.nxadx.delauncher.HOME_PRESSED")
                  sendBroadcast(localIntent)
              }
          }
      }
  }`;

          const lastBraceIndex = contents.lastIndexOf("}");
          if (lastBraceIndex !== -1) {
            contents =
              contents.slice(0, lastBraceIndex) +
              homeHandlerCode +
              "\n}\n";
          }
        }

        fs.writeFileSync(mainActivityPath, contents);
      }

      return config;
    },
  ]);

  return config;
};
