package expo.modules.delaunchernative.usagestats

import java.util.Date

/**
 * Object representing a timespan that an application was in the foreground.
 * Copied and adapted from Olauncher (app/src/main/java/app/olauncher/helper/usageStats/ComponentForegroundStat.kt).
 *
 * @property beginTime The start of the timespan, in milliseconds since the epoch.
 * @property endTime The end of the timespan, in milliseconds since the epoch.
 * @property packageName The package name of the application.
 */
data class ComponentForegroundStat(
    val beginTime: Long,
    val endTime: Long,
    val packageName: String
) {
    override fun toString(): String {
        return "ComponentForegroundStat(" +
                "beginTime=${Date(beginTime)}, " +
                "endTime=${Date(endTime)}, " +
                "packageName='$packageName')"
    }
}
