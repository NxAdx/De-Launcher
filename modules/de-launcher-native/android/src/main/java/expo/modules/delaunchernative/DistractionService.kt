package expo.modules.delaunchernative

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class DistractionService : AccessibilityService() {
    companion object {
        private const val TAG = "DistractionService"
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Allow system UI and our own launcher
            if (packageName == "com.android.systemui" || packageName == applicationContext.packageName) {
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
