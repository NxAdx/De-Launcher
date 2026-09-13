package expo.modules.delaunchernative

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class DeLauncherNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeLauncherNative")

    Events("onHomePressed")

    AsyncFunction("getInstalledApps") { ->
      appContext.reactContext?.let { context ->
        val appList = mutableListOf<Map<String, Any?>>()
        val seenPackages = HashSet<String>()
        val launcherApps = context.getSystemService(android.content.Context.LAUNCHER_APPS_SERVICE) as? android.content.pm.LauncherApps
        val userManager = context.getSystemService(android.content.Context.USER_SERVICE) as? android.os.UserManager
        val pm = context.packageManager
        val cacheDir = context.cacheDir
        val maxSize = 192

        data class PendingApp(
          val packageName: String,
          val label: String,
          val isSystem: Boolean,
          val lastUpdateTime: Long,
          val loadDrawable: () -> Drawable?
        )

        val pendingApps = mutableListOf<PendingApp>()

        if (launcherApps != null && userManager != null) {
          try {
            val profiles = userManager.userProfiles
            for (profile in profiles) {
              val activities = launcherApps.getActivityList(null, profile)
              for (info in activities) {
                val packageName = info.applicationInfo.packageName
                if (packageName == context.packageName) continue
                if (seenPackages.contains(packageName)) continue
                seenPackages.add(packageName)

                val label = info.label.toString()
                val isSystem = (info.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                var lastUpdateTime = 0L
                try {
                  lastUpdateTime = pm.getPackageInfo(packageName, 0).lastUpdateTime
                } catch (_: Exception) {}

                pendingApps.add(
                  PendingApp(
                    packageName = packageName,
                    label = label,
                    isSystem = isSystem,
                    lastUpdateTime = lastUpdateTime,
                    loadDrawable = { info.getIcon(0) ?: info.applicationInfo.loadIcon(pm) }
                  )
                )
              }
            }
          } catch (t: Throwable) {
            android.util.Log.e("DeLauncherNative", "Error using LauncherApps, falling back", t)
          }
        }

        if (pendingApps.isEmpty()) {
          val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
          }
          val apps = pm.queryIntentActivities(intent, 0)
          for (resolveInfo in apps) {
            val packageName = resolveInfo.activityInfo.packageName
            if (packageName == context.packageName) continue
            if (seenPackages.contains(packageName)) continue
            seenPackages.add(packageName)

            val label = resolveInfo.loadLabel(pm).toString()
            val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            var lastUpdateTime = 0L
            try {
              lastUpdateTime = pm.getPackageInfo(packageName, 0).lastUpdateTime
            } catch (_: Exception) {}

            pendingApps.add(
              PendingApp(
                packageName = packageName,
                label = label,
                isSystem = isSystem,
                lastUpdateTime = lastUpdateTime,
                loadDrawable = { resolveInfo.loadIcon(pm) }
              )
            )
          }
        }

        // Fast parallel icon resolution using multi-core thread pool
        val iconMap = java.util.concurrent.ConcurrentHashMap<String, String?>()
        val monoMap = java.util.concurrent.ConcurrentHashMap<String, String?>()
        val appsNeedingGeneration = mutableListOf<PendingApp>()

        for (app in pendingApps) {
          val iconFile = java.io.File(cacheDir, "app_icon_${app.packageName}_${app.lastUpdateTime}_${maxSize}.png")
          val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${app.packageName}_${app.lastUpdateTime}_${maxSize}.png")

          val hasIcon = iconFile.exists() && iconFile.length() > 0
          val hasMono = monoFile.exists() && monoFile.length() > 0

          if (hasIcon && hasMono) {
            iconMap[app.packageName] = "file://" + iconFile.absolutePath
            monoMap[app.packageName] = "file://" + monoFile.absolutePath
          } else if (hasIcon && !hasMono) {
            iconMap[app.packageName] = "file://" + iconFile.absolutePath
            if (generateMonoFromIconFile(iconFile, monoFile)) {
              monoMap[app.packageName] = "file://" + monoFile.absolutePath
            } else {
              appsNeedingGeneration.add(app)
            }
          } else {
            appsNeedingGeneration.add(app)
          }
        }

        if (appsNeedingGeneration.isNotEmpty()) {
          val numThreads = Runtime.getRuntime().availableProcessors().coerceIn(4, 8)
          val executor = java.util.concurrent.Executors.newFixedThreadPool(numThreads)
          try {
            val tasks = appsNeedingGeneration.map { app ->
              java.util.concurrent.Callable {
                try {
                  val drawable = app.loadDrawable()
                  if (drawable != null) {
                    val iconUri = drawableToUri(context, drawable, app.packageName, app.lastUpdateTime)
                    if (iconUri != null) iconMap[app.packageName] = iconUri
                    val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${app.packageName}_${app.lastUpdateTime}_${maxSize}.png")
                    if (monoFile.exists() && monoFile.length() > 0) {
                      monoMap[app.packageName] = "file://" + monoFile.absolutePath
                    }
                  }
                } catch (e: Exception) {
                  android.util.Log.w("DeLauncherNative", "Failed icon gen for ${app.packageName}", e)
                }
              }
            }
            executor.invokeAll(tasks, 20, java.util.concurrent.TimeUnit.SECONDS)
          } finally {
            executor.shutdown()
          }
        }

        for (app in pendingApps) {
          appList.add(
            mapOf(
              "packageName" to app.packageName,
              "label" to app.label,
              "icon" to iconMap[app.packageName],
              "monoIcon" to monoMap[app.packageName],
              "isSystem" to app.isSystem
            )
          )
        }

        appList
      } ?: emptyList<Map<String, Any?>>()
    }

    AsyncFunction("launchApp") { packageName: String ->
      appContext.reactContext?.let { context ->
        val pm = context.packageManager

        // Always try getLaunchIntentForPackage first — works for all apps including Settings on most OEMs
        var launchIntent = pm.getLaunchIntentForPackage(packageName)

        if (launchIntent != null) {
          launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
          try {
            context.startActivity(launchIntent)
            return@let
          } catch (e: Exception) {
            android.util.Log.w("DeLauncherNative", "getLaunchIntentForPackage failed for $packageName, trying fallbacks", e)
          }
        }

        // Fallback for Settings-like packages
        val isSettings = packageName.contains("settings", ignoreCase = true)
        if (isSettings) {
          try {
            context.startActivity(Intent(android.provider.Settings.ACTION_SETTINGS).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
            return@let
          } catch (e: Exception) {
            android.util.Log.e("DeLauncherNative", "ACTION_SETTINGS fallback also failed", e)
          }
        }

        // Final fallback: try to resolve any launchable activity for the package
        try {
          val intent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
            setPackage(packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "All launch attempts failed for $packageName", e)
        }
      }
    }

    AsyncFunction("promptSetDefaultLauncher") { ->
      appContext.reactContext?.let { context ->
        var launched = false
        
        // 1. Try Settings.ACTION_HOME_SETTINGS (API 21+)
        try {
          val intent = Intent(android.provider.Settings.ACTION_HOME_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
          launched = true
        } catch (e: Exception) {
          android.util.Log.w("DeLauncherNative", "Failed ACTION_HOME_SETTINGS, trying fallback intent", e)
        }
        
        if (!launched) {
          // 2. Try HOME intent to trigger default chooser
          try {
            val intent = Intent(Intent.ACTION_MAIN).apply {
              addCategory(Intent.CATEGORY_HOME)
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            launched = true
          } catch (e: Exception) {
            android.util.Log.w("DeLauncherNative", "Failed HOME category intent, trying global settings", e)
          }
        }
        
        if (!launched) {
          // 3. Try global Settings page
          try {
            val intent = Intent(android.provider.Settings.ACTION_SETTINGS).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
          } catch (e: Exception) {
            android.util.Log.e("DeLauncherNative", "Failed all fallback intents to open settings", e)
          }
        }
      }
    }

    AsyncFunction("changeWallpaper") { ->
      appContext.reactContext?.let { context ->
        val intent = Intent(Intent.ACTION_SET_WALLPAPER)
        val chooser = Intent.createChooser(intent, "Select Wallpaper")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
          context.startActivity(chooser)
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Error starting wallpaper chooser", e)
        }
      }
    }

    AsyncFunction("updateWhitelist") { whitelist: List<String> ->
      appContext.reactContext?.let { context ->
        val prefs = context.getSharedPreferences("delauncher_prefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().putStringSet("whitelist", whitelist.toSet()).apply()
      }
    }

    AsyncFunction("hasUsageStatsPermission") { ->
      appContext.reactContext?.let { context ->
        val appOps = context.getSystemService(android.content.Context.APP_OPS_SERVICE) as? android.app.AppOpsManager
        if (appOps != null) {
          val mode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
              android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
              android.os.Process.myUid(),
              context.packageName
            )
          } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
              android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
              android.os.Process.myUid(),
              context.packageName
            )
          }
          mode == android.app.AppOpsManager.MODE_ALLOWED
        } else {
          false
        }
      } ?: false
    }

    AsyncFunction("openUsageStatsSettings") { ->
      appContext.reactContext?.let { context ->
        try {
          val intent = Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Failed to open usage access settings", e)
        }
      }
    }

    AsyncFunction("openDigitalWellbeing") { ->
      appContext.reactContext?.let { context ->
        var launched = false
        val intents = listOf(
          Intent().setClassName("com.google.android.apps.wellbeing", "com.google.android.apps.wellbeing.home.TopLevelSettingsActivity"),
          Intent().setClassName("com.google.android.apps.wellbeing", "com.google.android.apps.wellbeing.settings.TopLevelSettingsActivity"),
          Intent().setClassName("com.samsung.android.forest", "com.samsung.android.forest.home.ui.MainActivity"),
          Intent().setClassName("com.samsung.android.forest", "com.samsung.android.forest.main.MainActivity"),
          Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
        )
        for (intent in intents) {
          try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            launched = true
            break
          } catch (_: Exception) {}
        }
        launched
      } ?: false
    }

    AsyncFunction("openClockApp") { ->
      appContext.reactContext?.let { context ->
        openClockApp(context)
      } ?: false
    }

    AsyncFunction("openCalendarApp") { ->
      appContext.reactContext?.let { context ->
        openCalendarApp(context)
      } ?: false
    }

    AsyncFunction("isAccessibilityActive") { ->
      DistractionService.isServiceActive()
    }

    AsyncFunction("lockScreen") { ->
      DistractionService.lockScreen()
    }

    AsyncFunction("openNotificationShade") { ->
      if (DistractionService.openNotificationShade()) {
        return@AsyncFunction true
      }
      appContext.reactContext?.let { context ->
        try {
          val statusBarService = context.getSystemService("statusbar")
          val statusBarManager = Class.forName("android.app.StatusBarManager")
          val method = statusBarManager.getMethod("expandNotificationsPanel")
          method.invoke(statusBarService)
          true
        } catch (e: Exception) {
          android.util.Log.w("DeLauncherNative", "Failed to expand notification shade via reflection", e)
          false
        }
      } ?: false
    }

    AsyncFunction("getScreenTimeToday") { ->
      appContext.reactContext?.let { context ->
        try {
          val wrapper = expo.modules.delaunchernative.usagestats.EventLogWrapper(context)
          val (totalMs, _) = wrapper.getTodaysUsage()
          val unlockCount = wrapper.getUnlockCountToday()
          mapOf(
            "screenTimeMs" to totalMs,
            "unlockCount" to unlockCount
          )
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Failed to get screen time", e)
          mapOf(
            "screenTimeMs" to 0L,
            "unlockCount" to 0
          )
        }
      } ?: mapOf("screenTimeMs" to 0L, "unlockCount" to 0)
    }

    AsyncFunction("getTopAppUsage") { limit: Int ->
      appContext.reactContext?.let { context ->
        try {
          val wrapper = expo.modules.delaunchernative.usagestats.EventLogWrapper(context)
          val (_, sortedApps) = wrapper.getTodaysUsage()
          val pm = context.packageManager
          val result = mutableListOf<Map<String, Any>>()
          val topList = sortedApps.take(limit)
          for (stat in topList) {
            var label = stat.applicationId
            try {
              val appInfo = pm.getApplicationInfo(stat.applicationId, 0)
              label = pm.getApplicationLabel(appInfo).toString()
            } catch (_: Exception) {}
            result.add(
              mapOf(
                "packageName" to stat.applicationId,
                "label" to label,
                "timeMs" to stat.timeUsed
              )
            )
          }
          result
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Failed to get top app usage", e)
          emptyList<Map<String, Any>>()
        }
      } ?: emptyList<Map<String, Any>>()
    }

    AsyncFunction("getAvailableIconPacks") { ->
      appContext.reactContext?.let { context ->
        val parser = IconPackParser(context)
        val packs = parser.getAvailableIconPacks()
        packs.map { pack ->
          mapOf(
            "packageName" to pack.packageName,
            "label" to pack.label,
            "mappingCount" to pack.iconMappings.size
          )
        }
      } ?: emptyList<Map<String, Any?>>()
    }

    AsyncFunction("getIconFromPack") { iconPackPackage: String, packageNameOrDrawableName: String ->
      appContext.reactContext?.let { context ->
        val parser = IconPackParser(context)
        val drawableName = parser.getDrawableNameForPackage(iconPackPackage, packageNameOrDrawableName) 
          ?: packageNameOrDrawableName.replace(".", "_").lowercase()
        parser.getIconFromPack(iconPackPackage, drawableName)
      }
    }

    AsyncFunction("getSystemAppIcon") { packageName: String ->
      appContext.reactContext?.let { context ->
        try {
          val pm = context.packageManager
          val cacheDir = context.cacheDir
          val appInfo = pm.getApplicationInfo(packageName, 0)
          val packageInfo = pm.getPackageInfo(packageName, 0)
          val lastUpdateTime = packageInfo.lastUpdateTime
          val maxSize = 192
          val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
          if (iconFile.exists() && iconFile.length() > 0) {
            "file://" + iconFile.absolutePath
          } else {
            val drawable = appInfo.loadIcon(pm)
            drawableToUri(context, drawable, packageName, lastUpdateTime)
          }
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Failed to get system app icon for $packageName", e)
          null
        }
      }
    }

    AsyncFunction("getMonochromeAppIcon") { packageName: String ->
      appContext.reactContext?.let { context ->
        try {
          val pm = context.packageManager
          val cacheDir = context.cacheDir
          val packageInfo = pm.getPackageInfo(packageName, 0)
          val lastUpdateTime = packageInfo.lastUpdateTime
          val maxSize = 192
          val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${packageName}_${lastUpdateTime}_${maxSize}.png")
          if (monoFile.exists() && monoFile.length() > 0) {
            "file://" + monoFile.absolutePath
          } else {
            val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
            if (iconFile.exists() && iconFile.length() > 0 && generateMonoFromIconFile(iconFile, monoFile)) {
              "file://" + monoFile.absolutePath
            } else {
              val appInfo = pm.getApplicationInfo(packageName, 0)
              val drawable = appInfo.loadIcon(pm)
              drawableToUri(context, drawable, packageName, lastUpdateTime)
              if (monoFile.exists() && monoFile.length() > 0) {
                "file://" + monoFile.absolutePath
              } else {
                null
              }
            }
          }
        } catch (e: Exception) {
          android.util.Log.e("DeLauncherNative", "Failed to get mono app icon for $packageName", e)
          null
        }
      }
    }

    AsyncFunction("getSystemAppIcons") { packageNames: List<String> ->
      appContext.reactContext?.let { context ->
        val pm = context.packageManager
        val cacheDir = context.cacheDir
        val maxSize = 192
        val result = java.util.concurrent.ConcurrentHashMap<String, String?>()
        val numThreads = Runtime.getRuntime().availableProcessors().coerceIn(4, 8)
        val executor = java.util.concurrent.Executors.newFixedThreadPool(numThreads)

        try {
          val tasks = packageNames.map { pkg ->
            java.util.concurrent.Callable {
              try {
                val packageInfo = pm.getPackageInfo(pkg, 0)
                val lastUpdateTime = packageInfo.lastUpdateTime
                val iconFile = java.io.File(cacheDir, "app_icon_${pkg}_${lastUpdateTime}_${maxSize}.png")
                if (iconFile.exists() && iconFile.length() > 0) {
                  result[pkg] = "file://" + iconFile.absolutePath
                } else {
                  val appInfo = pm.getApplicationInfo(pkg, 0)
                  val drawable = appInfo.loadIcon(pm)
                  result[pkg] = drawableToUri(context, drawable, pkg, lastUpdateTime)
                }
              } catch (e: Exception) {
                android.util.Log.w("DeLauncherNative", "Failed to load icon for $pkg", e)
                result[pkg] = null
              }
            }
          }
          executor.invokeAll(tasks, 5, java.util.concurrent.TimeUnit.SECONDS)
        } finally {
          executor.shutdown()
        }
        result.toMap()
      } ?: emptyMap<String, String?>()
    }

    AsyncFunction("getMonochromeAppIcons") { packageNames: List<String> ->
      appContext.reactContext?.let { context ->
        val pm = context.packageManager
        val cacheDir = context.cacheDir
        val maxSize = 192
        val result = java.util.concurrent.ConcurrentHashMap<String, String?>()
        val numThreads = Runtime.getRuntime().availableProcessors().coerceIn(4, 8)
        val executor = java.util.concurrent.Executors.newFixedThreadPool(numThreads)

        try {
          val tasks = packageNames.map { pkg ->
            java.util.concurrent.Callable {
              try {
                val packageInfo = pm.getPackageInfo(pkg, 0)
                val lastUpdateTime = packageInfo.lastUpdateTime
                val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${pkg}_${lastUpdateTime}_${maxSize}.png")
                if (monoFile.exists() && monoFile.length() > 0) {
                  result[pkg] = "file://" + monoFile.absolutePath
                } else {
                  val iconFile = java.io.File(cacheDir, "app_icon_${pkg}_${lastUpdateTime}_${maxSize}.png")
                  if (iconFile.exists() && iconFile.length() > 0 && generateMonoFromIconFile(iconFile, monoFile)) {
                    result[pkg] = "file://" + monoFile.absolutePath
                  } else {
                    val appInfo = pm.getApplicationInfo(pkg, 0)
                    val drawable = appInfo.loadIcon(pm)
                    drawableToUri(context, drawable, pkg, lastUpdateTime)
                    if (monoFile.exists() && monoFile.length() > 0) {
                      result[pkg] = "file://" + monoFile.absolutePath
                    } else {
                      result[pkg] = null
                    }
                  }
                }
              } catch (e: Exception) {
                android.util.Log.w("DeLauncherNative", "Failed to load mono icon for $pkg", e)
                result[pkg] = null
              }
            }
          }
          executor.invokeAll(tasks, 20, java.util.concurrent.TimeUnit.SECONDS)
        } finally {
          executor.shutdown()
        }
        result.toMap()
      } ?: emptyMap<String, String?>()
    }

    AsyncFunction("allocateAppWidgetId") { ->
      appWidgetHost?.allocateAppWidgetId() ?: -1
    }

    // This triggers the Android system UI to bind a widget, returning the widget ID on success.
    // NOTE: This usually requires a special Activity result handler. For now we will return -1 
    // and rely on a workaround or future improvement for the full binding flow.
    AsyncFunction("startWidgetBindFlow") { allocatedId: Int ->
      // This is a placeholder for the actual bind flow. 
      // Binding widgets requires startActivityForResult(AppWidgetManager.ACTION_APPWIDGET_BIND)
      // which is complex in an Expo module without a custom Activity or Fragment.
      // We will implement a simplified version or log it.
      -1
    }

    OnCreate {
      try {
        appContext.reactContext?.let { context ->
          appWidgetManager = android.appwidget.AppWidgetManager.getInstance(context)
          appWidgetHost = android.appwidget.AppWidgetHost(context, APPWIDGET_HOST_ID)
          appWidgetHost?.startListening()

          // Register BroadcastReceiver for Home button presses
          val filter = android.content.IntentFilter("com.nxadx.delauncher.HOME_PRESSED")
          homePressedReceiver = object : android.content.BroadcastReceiver() {
            override fun onReceive(c: android.content.Context?, intent: android.content.Intent?) {
              this@DeLauncherNativeModule.sendEvent("onHomePressed", mapOf<String, Any?>())
            }
          }
          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(homePressedReceiver, filter, android.content.Context.RECEIVER_NOT_EXPORTED)
          } else {
            context.registerReceiver(homePressedReceiver, filter)
          }
        }
      } catch (t: Throwable) {
        android.util.Log.e("DeLauncherNative", "Error in OnCreate initialization", t)
      }
    }

    OnDestroy {
      try {
        appWidgetHost?.stopListening()
        appContext.reactContext?.let { context ->
          homePressedReceiver?.let {
            context.unregisterReceiver(it)
            homePressedReceiver = null
          }
        }
      } catch (e: Exception) {
        android.util.Log.e("DeLauncherNative", "Error in OnDestroy", e)
      }
    }

    View(WidgetHostView::class) {
      Prop("appWidgetId") { view: WidgetHostView, appWidgetId: Int ->
        view.appWidgetHost = appWidgetHost
        view.appWidgetManager = appWidgetManager
        view.setAppWidgetId(appWidgetId)
      }
    }
  }

  private var appWidgetManager: android.appwidget.AppWidgetManager? = null
  private var appWidgetHost: android.appwidget.AppWidgetHost? = null
  private var homePressedReceiver: android.content.BroadcastReceiver? = null
  private val APPWIDGET_HOST_ID = 1024

  private fun isRealMatch(ri: android.content.pm.ResolveInfo?): Boolean {
    val pkg = ri?.activityInfo?.packageName ?: return false
    val name = ri.activityInfo?.name ?: ""
    if (pkg == "android" || pkg == "com.android.internal.app" || name.contains("ResolverActivity", ignoreCase = true)) {
      return false
    }
    return true
  }

  private fun openClockApp(context: android.content.Context): Boolean {
    val pm = context.packageManager

    // 1. AlarmClock.ACTION_SHOW_ALARMS with real match verification
    try {
      val intent = Intent(android.provider.AlarmClock.ACTION_SHOW_ALARMS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      val matches = pm.queryIntentActivities(intent, 0).filter(::isRealMatch)
      if (matches.isNotEmpty()) {
        if (matches.size == 1) {
          intent.setPackage(matches[0].activityInfo.packageName)
        }
        context.startActivity(intent)
        return true
      }
    } catch (_: Exception) {}

    // 2. Desk Dock Category intent with real match verification
    try {
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_DESK_DOCK)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      val matches = pm.queryIntentActivities(intent, 0).filter(::isRealMatch)
      if (matches.isNotEmpty()) {
        if (matches.size == 1) {
          intent.setPackage(matches[0].activityInfo.packageName)
        }
        context.startActivity(intent)
        return true
      }
    } catch (_: Exception) {}

    // 3. Known OEM and popular clock packages (Oppo/OnePlus ColorOS/Oplus, Samsung, Google, Xiaomi, Vivo, etc.)
    val knownClockPackages = listOf(
      "com.coloros.alarmclock",
      "com.coloros.clock",
      "com.oplus.clock",
      "com.heytap.clock",
      "com.oneplus.deskclock",
      "com.google.android.deskclock",
      "com.android.deskclock",
      "com.sec.android.app.clockpackage",
      "com.miui.deskclock",
      "com.vivo.clock",
      "com.motorola.blur.alarmclock",
      "com.asus.deskclock",
      "com.sonyericsson.organizer",
      "com.htc.android.worldclock"
    )
    for (pkg in knownClockPackages) {
      val launchIntent = pm.getLaunchIntentForPackage(pkg)
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
          context.startActivity(launchIntent)
          return true
        } catch (_: Exception) {}
      }
    }

    // 4. Scan all installed launcher apps for any app with "clock" or "alarm" in label/package
    try {
      val launcherIntent = Intent(Intent.ACTION_MAIN, null).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val allApps = pm.queryIntentActivities(launcherIntent, 0)
      for (ri in allApps) {
        val pkg = ri.activityInfo?.packageName ?: continue
        if (pkg == context.packageName) continue
        val label = ri.loadLabel(pm).toString()
        if (pkg.contains("clock", ignoreCase = true) ||
            pkg.contains("alarm", ignoreCase = true) ||
            label.contains("clock", ignoreCase = true) ||
            label.contains("alarm", ignoreCase = true)) {
          val launchIntent = pm.getLaunchIntentForPackage(pkg)
          if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
              context.startActivity(launchIntent)
              return true
            } catch (_: Exception) {}
          }
        }
      }
    } catch (_: Exception) {}

    return false
  }

  private fun openCalendarApp(context: android.content.Context): Boolean {
    val pm = context.packageManager

    // 1. CalendarContract.CONTENT_URI time view
    try {
      val calendarUri = android.provider.CalendarContract.CONTENT_URI
        .buildUpon()
        .appendPath("time")
        .appendPath(System.currentTimeMillis().toString())
        .build()
      val intent = Intent(Intent.ACTION_VIEW, calendarUri).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      val matches = pm.queryIntentActivities(intent, 0).filter(::isRealMatch)
      if (matches.isNotEmpty()) {
        if (matches.size == 1) {
          intent.setPackage(matches[0].activityInfo.packageName)
        }
        context.startActivity(intent)
        return true
      }
    } catch (_: Exception) {}

    // 2. CATEGORY_APP_CALENDAR intent
    try {
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_APP_CALENDAR)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      val matches = pm.queryIntentActivities(intent, 0).filter(::isRealMatch)
      if (matches.isNotEmpty()) {
        if (matches.size == 1) {
          intent.setPackage(matches[0].activityInfo.packageName)
        }
        context.startActivity(intent)
        return true
      }
    } catch (_: Exception) {}

    // 3. Known OEM and popular calendar packages
    val knownCalendarPackages = listOf(
      "com.coloros.calendar",
      "com.oplus.calendar",
      "com.heytap.calendar",
      "com.oneplus.calendar",
      "com.google.android.calendar",
      "com.android.calendar",
      "com.sec.android.app.calendar",
      "com.samsung.android.calendar",
      "com.miui.calendar",
      "com.vivo.calendar"
    )
    for (pkg in knownCalendarPackages) {
      val launchIntent = pm.getLaunchIntentForPackage(pkg)
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
          context.startActivity(launchIntent)
          return true
        } catch (_: Exception) {}
      }
    }

    // 4. Scan all installed launcher apps for any calendar app
    try {
      val launcherIntent = Intent(Intent.ACTION_MAIN, null).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val allApps = pm.queryIntentActivities(launcherIntent, 0)
      for (ri in allApps) {
        val pkg = ri.activityInfo?.packageName ?: continue
        if (pkg == context.packageName) continue
        val label = ri.loadLabel(pm).toString()
        if (pkg.contains("calendar", ignoreCase = true) || label.contains("calendar", ignoreCase = true)) {
          val launchIntent = pm.getLaunchIntentForPackage(pkg)
          if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
              context.startActivity(launchIntent)
              return true
            } catch (_: Exception) {}
          }
        }
      }
    } catch (_: Exception) {}

    return false
  }

  private fun generateMonoFromIconFile(iconFile: java.io.File, monoFile: java.io.File): Boolean {
    return try {
      val existingBmp = android.graphics.BitmapFactory.decodeFile(iconFile.absolutePath) ?: return false
      val monoBitmap = Bitmap.createBitmap(existingBmp.width, existingBmp.height, Bitmap.Config.ARGB_8888)
      val monoCanvas = Canvas(monoBitmap)
      val paint = android.graphics.Paint()
      val colorMatrix = android.graphics.ColorMatrix()
      colorMatrix.setSaturation(0f)
      paint.colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
      monoCanvas.drawBitmap(existingBmp, 0f, 0f, paint)

      val monoOut = java.io.BufferedOutputStream(java.io.FileOutputStream(monoFile))
      monoBitmap.compress(Bitmap.CompressFormat.PNG, 85, monoOut)
      monoOut.flush()
      monoOut.close()
      true
    } catch (e: Throwable) {
      android.util.Log.w("DeLauncherNative", "Failed to generate mono from existing icon", e)
      false
    }
  }

  private fun drawableToUri(context: android.content.Context, drawable: Drawable, packageName: String, lastUpdateTime: Long = 0L): String? {
    return try {
      val cacheDir = context.cacheDir
      val maxSize = 192
      val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
      
      if (iconFile.exists() && iconFile.length() > 0) {
        val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${packageName}_${lastUpdateTime}_${maxSize}.png")
        if (!monoFile.exists() || monoFile.length() == 0L) {
          generateMonoFromIconFile(iconFile, monoFile)
        }
        return "file://" + iconFile.absolutePath
      }

      val originalBitmap: Bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
        drawable.bitmap
      } else {
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 108
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 108
        val newBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(newBitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        newBitmap
      }
      val ratio = Math.min(maxSize.toFloat() / originalBitmap.width, maxSize.toFloat() / originalBitmap.height)
      val scaledBitmap = if (ratio < 1f) {
        Bitmap.createScaledBitmap(originalBitmap, (originalBitmap.width * ratio).toInt(), (originalBitmap.height * ratio).toInt(), true)
      } else {
        originalBitmap
      }

      val out = java.io.BufferedOutputStream(java.io.FileOutputStream(iconFile))
      scaledBitmap.compress(Bitmap.CompressFormat.PNG, 85, out)
      out.flush()
      out.close()

      // Generate monochrome / grayscale version directly from the complete icon bitmap
      // preserving authentic squircle background plates, shadows, and shapes across ALL apps
      try {
        val monoFile = java.io.File(cacheDir, "app_icon_mono_v3_${packageName}_${lastUpdateTime}_${maxSize}.png")
        val monoBitmap = Bitmap.createBitmap(scaledBitmap.width, scaledBitmap.height, Bitmap.Config.ARGB_8888)
        val monoCanvas = Canvas(monoBitmap)
        val paint = android.graphics.Paint()
        val colorMatrix = android.graphics.ColorMatrix()
        colorMatrix.setSaturation(0f)
        paint.colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
        monoCanvas.drawBitmap(scaledBitmap, 0f, 0f, paint)

        val monoOut = java.io.BufferedOutputStream(java.io.FileOutputStream(monoFile))
        monoBitmap.compress(Bitmap.CompressFormat.PNG, 85, monoOut)
        monoOut.flush()
        monoOut.close()
      } catch (monoErr: Throwable) {
        android.util.Log.w("DeLauncherNative", "Failed to cache mono icon for $packageName", monoErr)
      }
      
      "file://" + iconFile.absolutePath
    } catch (t: Throwable) {
      android.util.Log.e("DeLauncherNative", "Failed to cache drawable", t)
      null
    }
  }
}
