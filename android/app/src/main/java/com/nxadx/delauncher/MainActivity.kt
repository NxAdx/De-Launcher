package com.nxadx.delauncher
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
    enableHighRefreshRate()
  }

  private fun enableHighRefreshRate() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val window = window ?: return
        val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
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
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

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
  }
}
