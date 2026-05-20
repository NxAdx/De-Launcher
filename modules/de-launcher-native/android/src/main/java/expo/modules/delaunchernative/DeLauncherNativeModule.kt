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

    AsyncFunction("getInstalledApps") { ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN, null).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      
      val apps = pm.queryIntentActivities(intent, 0)
      val appList = mutableListOf<Map<String, Any?>>()

      for (resolveInfo in apps) {
        val packageName = resolveInfo.activityInfo.packageName
        // Exclude our own launcher app
        if (packageName == context.packageName) continue

        val label = resolveInfo.loadLabel(pm).toString()
        val drawable = resolveInfo.loadIcon(pm)
        val iconBase64 = drawableToBase64(drawable)
        val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

        appList.add(
          mapOf(
            "packageName" to packageName,
            "label" to label,
            "icon" to iconBase64,
            "isSystem" to isSystem
          )
        )
      }
      return@AsyncFunction appList
    }

    AsyncFunction("launchApp") { packageName: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val pm = context.packageManager
      val launchIntent = pm.getLaunchIntentForPackage(packageName)
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launchIntent)
      }
    }

    AsyncFunction("updateWhitelist") { whitelist: List<String> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val prefs = context.getSharedPreferences("delauncher_prefs", android.content.Context.MODE_PRIVATE)
      prefs.edit().putStringSet("whitelist", whitelist.toSet()).apply()
    }

    AsyncFunction("getAvailableIconPacks") { ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      val parser = IconPackParser(context)
      val packs = parser.getAvailableIconPacks()
      packs.map { pack ->
        mapOf(
          "packageName" to pack.packageName,
          "label" to pack.label,
          "mappingCount" to pack.iconMappings.size
        )
      }
    }

    AsyncFunction("getIconFromPack") { iconPackPackage: String, drawableName: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null
      val parser = IconPackParser(context)
      parser.getIconFromPack(iconPackPackage, drawableName)
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
        appContext.reactContext?.let {
          appWidgetManager = android.appwidget.AppWidgetManager.getInstance(it)
          appWidgetHost = android.appwidget.AppWidgetHost(it, APPWIDGET_HOST_ID)
          appWidgetHost?.startListening()
        }
      } catch (e: Exception) {
        android.util.Log.e("DeLauncherNative", "Error in OnCreate initialization", e)
      }
    }

    OnDestroy {
      try {
        appWidgetHost?.stopListening()
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
  private val APPWIDGET_HOST_ID = 1024

  private fun drawableToBase64(drawable: Drawable): String? {
    return try {
      val bitmap: Bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
        drawable.bitmap
      } else {
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 1
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 1
        val newBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(newBitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        newBitmap
      }
      
      val outputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      val byteArray = outputStream.toByteArray()
      "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
    } catch (e: Exception) {
      android.util.Log.e("DeLauncherNative", "Failed to convert drawable to base64", e)
      null
    }
  }
}
