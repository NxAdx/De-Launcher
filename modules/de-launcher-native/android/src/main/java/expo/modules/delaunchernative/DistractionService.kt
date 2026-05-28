package expo.modules.delaunchernative

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class DistractionService : AccessibilityService() {
    companion object {
        private const val TAG = "DistractionService"
        private val ALWAYS_ALLOWED_SYSTEM_PACKAGES = setOf(
            "android",
            "com.android.systemui",
            "com.android.settings",
            "com.android.permissioncontroller",
            "com.google.android.permissioncontroller",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller"
        )
    }

    private val configurationPackages: Set<String> by lazy {
        val packages = ALWAYS_ALLOWED_SYSTEM_PACKAGES.toMutableSet()
        listOf(
            Settings.ACTION_SETTINGS,
            Settings.ACTION_ACCESSIBILITY_SETTINGS,
            Settings.ACTION_HOME_SETTINGS,
            Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS
        ).forEach { action ->
            packageManager.resolveActivity(
                Intent(action),
                PackageManager.MATCH_DEFAULT_ONLY
            )?.activityInfo?.packageName?.let(packages::add)
        }
        packages
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Never block the routes required to configure or leave the launcher.
            if (packageName == applicationContext.packageName || configurationPackages.contains(packageName)) {
                return
            }

            val prefs = applicationContext.getSharedPreferences("delauncher_prefs", Context.MODE_PRIVATE)
            val whitelist = prefs.getStringSet("whitelist", emptySet()) ?: emptySet()

            Log.d(TAG, "Window changed to: $packageName, whitelisted: ${whitelist.contains(packageName)}")

            if (!whitelist.contains(packageName)) {
                Log.d(TAG, "Package $packageName is NOT in whitelist. Blocking distraction.")
                // Force return to home
                performGlobalAction(GLOBAL_ACTION_HOME)
            }
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service Interrupted")
    }
}
