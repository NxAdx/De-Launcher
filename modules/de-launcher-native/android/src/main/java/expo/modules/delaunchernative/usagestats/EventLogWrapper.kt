package expo.modules.delaunchernative.usagestats

import android.app.ActivityManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.icu.util.Calendar
import android.util.Log
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min

/**
 * Collects event information from system to calculate and aggregate precise
 * foreground time statistics for the specified period.
 * Copied and adapted from Olauncher (app/src/main/java/app/olauncher/helper/usageStats/EventLogWrapper.kt).
 */
class EventLogWrapper(private val context: Context) {
    private val usageStatsManager by lazy { context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager }
    private val guardian = UnmatchedCloseEventGuardian(usageStatsManager)

    fun getForegroundStatsByTimestamps(start: Long, end: Long): List<ComponentForegroundStat> {
        var queryStart = start

        val foregroundProcesses = mutableListOf<String>()
        if (end >= System.currentTimeMillis() - 1500) {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            activityManager?.runningAppProcesses?.forEach { appProcess ->
                if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND ||
                    appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE
                ) {
                    if (context.packageName != appProcess.processName) {
                        foregroundProcesses.add(appProcess.processName)
                    }
                }
            }
        }

        val events = usageStatsManager.queryEvents(queryStart, end)
        val moveToForegroundMap = mutableMapOf<AppClass, Long?>()
        val componentForegroundStats = mutableListOf<ComponentForegroundStat>()
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (context.packageName == event.packageName) continue

            val appClass = AppClass(event.packageName, event.className)

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED, 4 -> {
                    moveToForegroundMap[appClass] = event.timeStamp
                }

                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED,
                3 -> {
                    val eventBeginTime: Long? = moveToForegroundMap[appClass]?.also {
                        moveToForegroundMap[appClass] = null
                    } ?: if (
                        moveToForegroundMap.keys.none { it.packageName == event.packageName } &&
                        guardian.test(event, queryStart)
                    ) {
                        queryStart
                    } else {
                        null
                    }

                    if (eventBeginTime != null) {
                        val endTime = moveToForegroundMap.entries
                            .filter { (key, value) -> key.packageName == event.packageName && value != null }
                            .mapNotNull { it.value }
                            .minOrNull() ?: event.timeStamp

                        componentForegroundStats.add(
                            ComponentForegroundStat(eventBeginTime, endTime, event.packageName)
                        )
                    }
                }

                UsageEvents.Event.DEVICE_SHUTDOWN -> {
                    moveToForegroundMap.forEach { (key, value) ->
                        if (value != null) {
                            componentForegroundStats.add(
                                ComponentForegroundStat(value, event.timeStamp, key.packageName)
                            )
                            moveToForegroundMap.keys
                                .filter { it.packageName == key.packageName }
                                .forEach { samePackageKey -> moveToForegroundMap[samePackageKey] = null }
                        }
                    }
                }

                UsageEvents.Event.DEVICE_STARTUP -> {
                    moveToForegroundMap.clear()
                    queryStart = event.timeStamp
                }
            }
        }

        moveToForegroundMap.forEach { (key, value) ->
            if (value != null) {
                if (foregroundProcesses.any { it.contains(key.packageName) }) {
                    componentForegroundStats.add(
                        ComponentForegroundStat(
                            value,
                            min(System.currentTimeMillis(), end),
                            key.packageName
                        )
                    )
                }
            }
        }

        if (moveToForegroundMap.isEmpty()) {
            val packageManager = context.packageManager
            foregroundProcesses.forEach { foregroundProcess ->
                if (packageManager.getLaunchIntentForPackage(foregroundProcess) != null) {
                    componentForegroundStats.add(
                        ComponentForegroundStat(
                            queryStart,
                            min(System.currentTimeMillis(), end),
                            foregroundProcess
                        )
                    )
                    Log.d("EventLogWrapper", "Assuming that application $foregroundProcess has been used the whole query time")
                }
            }
        }

        return componentForegroundStats
    }

    fun aggregateForegroundStats(
        foregroundStats: List<ComponentForegroundStat>
    ): List<SimpleUsageStat> {
        if (foregroundStats.isEmpty()) return emptyList()

        val applicationTotalTime = foregroundStats
            .groupBy { it.packageName }
            .mapValues { (_, stats) ->
                mergeOverlappingIntervals(stats).sumOf { it.endTime - it.beginTime }
            }

        val firstBeginTime = foregroundStats.first().beginTime
        val timeZoneOffset = Calendar.getInstance().timeZone.getOffset(firstBeginTime)
        val day = TimeUnit.MILLISECONDS.toDays(firstBeginTime + timeZoneOffset)

        return applicationTotalTime.map { (packageName, totalTime) ->
            SimpleUsageStat(day, totalTime, packageName)
        }
    }

    fun aggregateSimpleUsageStats(usageStats: List<SimpleUsageStat>): Long {
        return usageStats.sumOf { it.timeUsed }
    }

    /**
     * Calculates total screen time today in milliseconds and top app usage.
     */
    fun getTodaysUsage(): Pair<Long, List<SimpleUsageStat>> {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val foregroundStats = getForegroundStatsByTimestamps(startTime, endTime)
        val aggregated = aggregateForegroundStats(foregroundStats)
        val totalMs = aggregateSimpleUsageStats(aggregated)
        val sortedApps = aggregated.sortedByDescending { it.timeUsed }

        return Pair(totalMs, sortedApps)
    }

    /**
     * Returns screen unlock count today by querying KEYGUARD_HIDDEN / SCREEN_INTERACTIVE events.
     */
    fun getUnlockCountToday(): Int {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val events = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        var unlockCount = 0

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            // UsageEvents.Event.KEYGUARD_HIDDEN = 18, USER_INTERACTION = 7, SCREEN_INTERACTIVE = 15
            if (event.eventType == 18 || event.eventType == UsageEvents.Event.KEYGUARD_HIDDEN) {
                unlockCount++
            }
        }
        return unlockCount
    }

    /**
     * Calculates total screen time yesterday in milliseconds and unlock count.
     */
    fun getYesterdaysUsage(): Pair<Long, Int> {
        val startCal = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val endCal = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -1)
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }
        val startTime = startCal.timeInMillis
        val endTime = endCal.timeInMillis

        val foregroundStats = getForegroundStatsByTimestamps(startTime, endTime)
        val aggregated = aggregateForegroundStats(foregroundStats)
        val totalMs = aggregateSimpleUsageStats(aggregated)

        val events = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        var unlockCount = 0
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == 18 || event.eventType == UsageEvents.Event.KEYGUARD_HIDDEN) {
                unlockCount++
            }
        }
        return Pair(totalMs, unlockCount)
    }

    /**
     * Returns past [days] history of screen time and unlocks (e.g. past 7 days).
     */
    fun getDailyUsageHistory(days: Int = 7): List<Map<String, Any>> {
        val history = mutableListOf<Map<String, Any>>()
        val dayNames = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

        for (i in (days - 1) downTo 0) {
            val cal = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -i)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val startTime = cal.timeInMillis

            val endCal = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -i)
                set(Calendar.HOUR_OF_DAY, 23)
                set(Calendar.MINUTE, 59)
                set(Calendar.SECOND, 59)
                set(Calendar.MILLISECOND, 999)
            }
            val endTime = min(endCal.timeInMillis, System.currentTimeMillis())

            val foregroundStats = getForegroundStatsByTimestamps(startTime, endTime)
            val aggregated = aggregateForegroundStats(foregroundStats)
            val totalMs = aggregateSimpleUsageStats(aggregated)

            val events = usageStatsManager.queryEvents(startTime, endTime)
            val event = UsageEvents.Event()
            var unlockCount = 0
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == 18 || event.eventType == UsageEvents.Event.KEYGUARD_HIDDEN) {
                    unlockCount++
                }
            }

            val dayOfWeek = dayNames[cal.get(Calendar.DAY_OF_WEEK) - 1]
            val dayOfMonth = cal.get(Calendar.DAY_OF_MONTH)
            val month = cal.get(Calendar.MONTH) + 1
            val dateStr = String.format("%04d-%02d-%02d", cal.get(Calendar.YEAR), month, dayOfMonth)

            history.add(
                mapOf(
                    "date" to dateStr,
                    "dayOfWeek" to dayOfWeek,
                    "dayOfMonth" to dayOfMonth,
                    "screenTimeMs" to totalMs,
                    "unlockCount" to unlockCount,
                    "isToday" to (i == 0)
                )
            )
        }
        return history
    }

    private fun mergeOverlappingIntervals(
        stats: List<ComponentForegroundStat>
    ): List<ComponentForegroundStat> {
        if (stats.size <= 1) return stats

        val sorted = stats.sortedBy { it.beginTime }
        val merged = mutableListOf<ComponentForegroundStat>()
        var current = sorted[0]

        for (i in 1 until sorted.size) {
            val next = sorted[i]
            if (next.beginTime <= current.endTime) {
                current = ComponentForegroundStat(
                    current.beginTime,
                    max(current.endTime, next.endTime),
                    current.packageName
                )
            } else {
                merged.add(current)
                current = next
            }
        }
        merged.add(current)
        return merged
    }

    private data class AppClass(val packageName: String, val className: String?)
}
