package expo.modules.delaunchernative.usagestats

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.util.Log

/**
 * Guards [EventLogWrapper] against Faulty unmatched close events.
 * Copied and adapted from Olauncher (app/src/main/java/app/olauncher/helper/usageStats/UnmatchedCloseEventGuardian.kt).
 */
class UnmatchedCloseEventGuardian(private val usageStatsManager: UsageStatsManager) {

    companion object {
        private const val SCAN_INTERVAL = 1000L * 60 * 60 * 24 // 24 hours
    }

    /**
     * @param event      Event to validate
     * @param queryStart Timestamp at which original query started
     * @return True if the event is valid, false otherwise
     */
    fun test(event: UsageEvents.Event, queryStart: Long): Boolean {
        val events = usageStatsManager.queryEvents(queryStart - SCAN_INTERVAL, queryStart)

        val e = UsageEvents.Event()
        var open = false

        while (events.hasNextEvent()) {
            events.getNextEvent(e)

            if (e.eventType == UsageEvents.Event.DEVICE_STARTUP) {
                open = false
            }

            if (event.packageName == e.packageName) {
                when (e.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED, 4 -> {
                        open = true
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED, 3 -> {
                        if (e.timeStamp != event.timeStamp) {
                            open = false
                        }
                    }
                }
            }
        }

        val result = if (open) "True" else "Faulty"
        Log.d("Guardian", "Scanned for package ${event.packageName} and determined event to be $result")

        return open
    }
}
