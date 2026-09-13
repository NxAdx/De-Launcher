package expo.modules.delaunchernative.usagestats

import android.app.usage.UsageStats
import android.icu.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * A data class to hold simplified usage statistics.
 * Copied and adapted from Olauncher (app/src/main/java/app/olauncher/helper/usageStats/SimpleUsageStat.kt).
 *
 * @property day The day since epoch that this object concerns.
 * @property timeUsed The time that the application has been in the foreground in milliseconds on this day.
 * @property applicationId The package name of the application that this object concerns.
 */
data class SimpleUsageStat(
    val day: Long,
    val timeUsed: Long,
    val applicationId: String
) {
    constructor(systemUsageStat: UsageStats) : this(
        day = getEpochDay(systemUsageStat.lastTimeUsed),
        timeUsed = systemUsageStat.totalTimeInForeground,
        applicationId = systemUsageStat.packageName
    )

    companion object {
        @JvmStatic
        fun asSimpleStats(usageStats: List<UsageStats>): List<SimpleUsageStat> {
            return usageStats.map { SimpleUsageStat(it) }
        }

        private fun getEpochDay(lastTimeUsed: Long): Long {
            val timeZoneOffset = Calendar.getInstance().timeZone.getOffset(lastTimeUsed)
            return TimeUnit.MILLISECONDS.toDays(lastTimeUsed + timeZoneOffset)
        }
    }
}
