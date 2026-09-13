package expo.modules.delaunchernative

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class DistractionService : AccessibilityService() {
    companion object {
        private const val TAG = "DistractionService"
        @Volatile private var instance: DistractionService? = null

        fun isServiceActive(): Boolean = instance != null

        fun lockScreen(): Boolean {
            val svc = instance ?: return false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return svc.performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
            }
            return false
        }

        fun openNotificationShade(): Boolean {
            val svc = instance ?: return false
            return svc.performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
        }

        fun returnHome(): Boolean {
            val svc = instance ?: return false
            return svc.performGlobalAction(GLOBAL_ACTION_HOME)
        }

        private val ALWAYS_ALLOWED_SYSTEM_PACKAGES = setOf(
            "android",
            "com.android.systemui",
            "com.android.settings",
            "com.android.permissioncontroller",
            "com.google.android.permissioncontroller",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller"
        )

        private val OEM_SYSTEM_PREFIXES = listOf(
            "android",
            "com.android.",
            "com.google.android.",
            "com.vivo.",
            "com.bbk.",
            "com.samsung.",
            "com.sec.android.",
            "com.miui.",
            "com.xiaomi.",
            "com.coloros.",
            "com.oplus.",
            "com.oneplus.",
            "com.huawei.",
            "com.transsion.",
            "com.motorola."
        )
    }

    private var screenReceiver: BroadcastReceiver? = null
    private var lastScreenOffTimestamp: Long = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        registerScreenStateReceiver()
        Log.d(TAG, "DistractionService connected")
    }

    override fun onDestroy() {
        unregisterScreenStateReceiver()
        if (instance === this) {
            instance = null
        }
        super.onDestroy()
        Log.d(TAG, "DistractionService destroyed")
    }

    private fun registerScreenStateReceiver() {
        if (screenReceiver != null) return
        screenReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    Intent.ACTION_SCREEN_OFF -> {
                        lastScreenOffTimestamp = System.currentTimeMillis()
                    }
                    Intent.ACTION_USER_PRESENT -> {
                        handleUserPresent()
                    }
                }
            }
        }
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(screenReceiver, filter)
        }
    }

    private fun unregisterScreenStateReceiver() {
        screenReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
            screenReceiver = null
        }
    }

    private fun handleUserPresent() {
        val prefs = applicationContext.getSharedPreferences("delauncher_prefs", Context.MODE_PRIVATE)
        val returnHomeEnabled = prefs.getBoolean("return_home_after_lock", true)
        val timeoutMinutes = prefs.getInt("return_home_timeout_minutes", 5)

        if (!returnHomeEnabled) return

        val now = System.currentTimeMillis()
        val thresholdMs = timeoutMinutes * 60_000L

        if (lastScreenOffTimestamp > 0 && (now - lastScreenOffTimestamp >= thresholdMs)) {
            Log.d(TAG, "Returning to home screen after long lock (${timeoutMinutes}m threshold)")
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
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

    private fun isSystemOrNonBlockable(packageName: String): Boolean {
        if (packageName == applicationContext.packageName) return true
        if (ALWAYS_ALLOWED_SYSTEM_PACKAGES.contains(packageName)) return true
        if (configurationPackages.contains(packageName)) return true

        // 1. Any package without a launcher activity (system plugins, navigation gestures like com.vivo.upslide, lockscreens)
        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0 ||
                    (appInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0

            if (launchIntent == null || isSystem) {
                if (OEM_SYSTEM_PREFIXES.any { packageName.startsWith(it) }) {
                    return true
                }
                if (launchIntent == null) {
                    return true
                }
            }
        } catch (_: Exception) {
            return true // If cannot be inspected, never block
        }

        // 2. Input Method Editors (Keyboards)
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? android.view.inputmethod.InputMethodManager
            val imes = imm?.enabledInputMethodList ?: emptyList()
            if (imes.any { it.packageName == packageName }) {
                return true
            }
        } catch (_: Exception) {}

        // 3. Telephony / Dialers
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val telecom = getSystemService(Context.TELECOM_SERVICE) as? android.telecom.TelecomManager
                if (telecom?.defaultDialerPackage == packageName) {
                    return true
                }
            }
        } catch (_: Exception) {}

        return false
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // Absolute immunity for system packages, OEM gestures, settings, and keyboards
            if (isSystemOrNonBlockable(packageName)) {
                return
            }

            val prefs = applicationContext.getSharedPreferences("delauncher_prefs", Context.MODE_PRIVATE)
            val blockedPackages = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()
            val intentPausePackages = prefs.getStringSet("intent_pause_packages", emptySet()) ?: emptySet()

            // Only intercept packages explicitly placed on the focus block/pause list
            if (blockedPackages.contains(packageName) || intentPausePackages.contains(packageName)) {
                Log.d(TAG, "Explicit focus block: $packageName")
                val uri = android.net.Uri.parse("delauncher://?blocked_pkg=$packageName")
                val launchIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    setPackage(applicationContext.packageName)
                }
                startActivity(launchIntent)
            }
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service Interrupted")
    }
}
