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

        if (launcherApps != null && userManager != null) {
          try {
            val profiles = userManager.userProfiles
            for (profile in profiles) {
              val activities = launcherApps.getActivityList(null, profile)
              for (info in activities) {
                val packageName = info.applicationInfo.packageName
                // Exclude our own launcher app
                if (packageName == context.packageName) continue
                // Deduplicate packages so apps with multiple launcher activities only appear once
                if (seenPackages.contains(packageName)) continue
                seenPackages.add(packageName)

                val label = info.label.toString()
                var iconUri: String? = null
                var monoUri: String? = null
                try {
                  val packageInfo = pm.getPackageInfo(packageName, 0)
                  val lastUpdateTime = packageInfo.lastUpdateTime
                  val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
                  val monoFile = java.io.File(cacheDir, "app_icon_mono_${packageName}_${lastUpdateTime}_${maxSize}.png")

                  if (iconFile.exists() && iconFile.length() > 0) {
                    iconUri = "file://" + iconFile.absolutePath
                    if (monoFile.exists() && monoFile.length() > 0) {
                      monoUri = "file://" + monoFile.absolutePath
                    } else {
                      val drawable = info.getIcon(0) ?: info.applicationInfo.loadIcon(pm)
                      iconUri = drawableToUri(context, drawable, packageName, lastUpdateTime)
                      if (monoFile.exists()) monoUri = "file://" + monoFile.absolutePath
                    }
                  } else {
                    val drawable = info.getIcon(0) ?: info.applicationInfo.loadIcon(pm)
                    iconUri = drawableToUri(context, drawable, packageName, lastUpdateTime)
                    if (monoFile.exists()) monoUri = "file://" + monoFile.absolutePath
                  }
                } catch (e: Exception) {
                  // Fallback: icon will load on demand
                }

                val isSystem = (info.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                appList.add(
                  mapOf(
                    "packageName" to packageName,
                    "label" to label,
                    "icon" to iconUri,
                    "monoIcon" to monoUri,
                    "isSystem" to isSystem
                  )
                )
              }
            }
          } catch (t: Throwable) {
            android.util.Log.e("DeLauncherNative", "Error using LauncherApps, falling back", t)
          }
        }

        if (appList.isEmpty()) {
          val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
          }
          
          val apps = pm.queryIntentActivities(intent, 0)
          for (resolveInfo in apps) {
            val packageName = resolveInfo.activityInfo.packageName
            // Exclude our own launcher app
            if (packageName == context.packageName) continue
            // Deduplicate packages
            if (seenPackages.contains(packageName)) continue
            seenPackages.add(packageName)

            val label = resolveInfo.loadLabel(pm).toString()
            var iconUri: String? = null
            var monoUri: String? = null
            try {
              val packageInfo = pm.getPackageInfo(packageName, 0)
              val lastUpdateTime = packageInfo.lastUpdateTime
              val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
              val monoFile = java.io.File(cacheDir, "app_icon_mono_${packageName}_${lastUpdateTime}_${maxSize}.png")
              if (iconFile.exists() && iconFile.length() > 0) {
                iconUri = "file://" + iconFile.absolutePath
                if (monoFile.exists() && monoFile.length() > 0) {
                  monoUri = "file://" + monoFile.absolutePath
                } else {
                  val drawable = resolveInfo.loadIcon(pm)
                  iconUri = drawableToUri(context, drawable, packageName, lastUpdateTime)
                  if (monoFile.exists()) monoUri = "file://" + monoFile.absolutePath
                }
              } else {
                val drawable = resolveInfo.loadIcon(pm)
                iconUri = drawableToUri(context, drawable, packageName, lastUpdateTime)
                if (monoFile.exists()) monoUri = "file://" + monoFile.absolutePath
              }
            } catch (e: Exception) {
              // Fallback
            }

            val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

            appList.add(
              mapOf(
                "packageName" to packageName,
                "label" to label,
                "icon" to iconUri,
                "monoIcon" to monoUri,
                "isSystem" to isSystem
              )
            )
          }
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
          val appInfo = pm.getApplicationInfo(packageName, 0)
          val packageInfo = pm.getPackageInfo(packageName, 0)
          val lastUpdateTime = packageInfo.lastUpdateTime
          val maxSize = 192
          val monoFile = java.io.File(cacheDir, "app_icon_mono_${packageName}_${lastUpdateTime}_${maxSize}.png")
          if (monoFile.exists() && monoFile.length() > 0) {
            "file://" + monoFile.absolutePath
          } else {
            val drawable = appInfo.loadIcon(pm)
            drawableToUri(context, drawable, packageName, lastUpdateTime)
            if (monoFile.exists() && monoFile.length() > 0) {
              "file://" + monoFile.absolutePath
            } else {
              null
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
        val result = mutableMapOf<String, String?>()
        for (pkg in packageNames) {
          try {
            val appInfo = pm.getApplicationInfo(pkg, 0)
            val packageInfo = pm.getPackageInfo(pkg, 0)
            val lastUpdateTime = packageInfo.lastUpdateTime
            val iconFile = java.io.File(cacheDir, "app_icon_${pkg}_${lastUpdateTime}_${maxSize}.png")
            if (iconFile.exists() && iconFile.length() > 0) {
              result[pkg] = "file://" + iconFile.absolutePath
            } else {
              val drawable = appInfo.loadIcon(pm)
              result[pkg] = drawableToUri(context, drawable, pkg, lastUpdateTime)
            }
          } catch (e: Exception) {
            android.util.Log.w("DeLauncherNative", "Failed to load icon for $pkg", e)
            result[pkg] = null
          }
        }
        result
      } ?: emptyMap<String, String?>()
    }

    AsyncFunction("getMonochromeAppIcons") { packageNames: List<String> ->
      appContext.reactContext?.let { context ->
        val pm = context.packageManager
        val cacheDir = context.cacheDir
        val maxSize = 192
        val result = mutableMapOf<String, String?>()
        for (pkg in packageNames) {
          try {
            val packageInfo = pm.getPackageInfo(pkg, 0)
            val lastUpdateTime = packageInfo.lastUpdateTime
            val monoFile = java.io.File(cacheDir, "app_icon_mono_${pkg}_${lastUpdateTime}_${maxSize}.png")
            if (monoFile.exists() && monoFile.length() > 0) {
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
          } catch (e: Exception) {
            android.util.Log.w("DeLauncherNative", "Failed to load mono icon for $pkg", e)
            result[pkg] = null
          }
        }
        result
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

  private fun drawableToUri(context: android.content.Context, drawable: Drawable, packageName: String, lastUpdateTime: Long = 0L): String? {
    return try {
      val cacheDir = context.cacheDir
      val maxSize = 192
      val iconFile = java.io.File(cacheDir, "app_icon_${packageName}_${lastUpdateTime}_${maxSize}.png")
      
      if (iconFile.exists() && iconFile.length() > 0) {
        val monoFile = java.io.File(cacheDir, "app_icon_mono_${packageName}_${lastUpdateTime}_${maxSize}.png")
        if (!monoFile.exists() || monoFile.length() == 0L) {
          try {
            val existingBmp = android.graphics.BitmapFactory.decodeFile(iconFile.absolutePath)
            if (existingBmp != null) {
              val monoBitmap = Bitmap.createBitmap(existingBmp.width, existingBmp.height, Bitmap.Config.ARGB_8888)
              val monoCanvas = Canvas(monoBitmap)
              val paint = android.graphics.Paint()
              val colorMatrix = android.graphics.ColorMatrix()
              colorMatrix.setSaturation(0f)
              paint.colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
              monoCanvas.drawBitmap(existingBmp, 0f, 0f, paint)

              val monoOut = java.io.BufferedOutputStream(java.io.FileOutputStream(monoFile))
              monoBitmap.compress(Bitmap.CompressFormat.PNG, 90, monoOut)
              monoOut.flush()
              monoOut.close()
            }
          } catch (e: Throwable) {
            android.util.Log.w("DeLauncherNative", "Failed to generate mono from existing icon", e)
          }
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
      scaledBitmap.compress(Bitmap.CompressFormat.PNG, 90, out)
      out.flush()
      out.close()

      // Generate monochrome / grayscale version
      try {
        val monoFile = java.io.File(cacheDir, "app_icon_mono_${packageName}_${lastUpdateTime}_${maxSize}.png")
        val monoBitmap = Bitmap.createBitmap(scaledBitmap.width, scaledBitmap.height, Bitmap.Config.ARGB_8888)
        val monoCanvas = Canvas(monoBitmap)
        val paint = android.graphics.Paint()
        val colorMatrix = android.graphics.ColorMatrix()
        colorMatrix.setSaturation(0f)
        paint.colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
        monoCanvas.drawBitmap(scaledBitmap, 0f, 0f, paint)

        val monoOut = java.io.BufferedOutputStream(java.io.FileOutputStream(monoFile))
        monoBitmap.compress(Bitmap.CompressFormat.PNG, 90, monoOut)
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
