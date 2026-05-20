package expo.modules.delaunchernative

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.util.Base64
import android.util.Log
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.ByteArrayOutputStream
import java.io.InputStream

data class IconPackInfo(
    val packageName: String,
    val label: String,
    val iconMappings: Map<String, String> // packageName to drawable resource name
)

class IconPackParser(private val context: Context) {
    companion object {
        private const val TAG = "IconPackParser"
        // Cache mapping from icon pack package name to its parsed appfilter mappings
        private val mappingsCache = java.util.concurrent.ConcurrentHashMap<String, Map<String, String>>()
    }

    /**
     * Get all available icon packs installed on the device.
     */
    fun getAvailableIconPacks(): List<IconPackInfo> {
        val pm = context.packageManager
        val iconPacks = mutableListOf<IconPackInfo>()
        val iconPackPackages = mutableSetOf<String>()

        val actions = listOf(
            "org.adw.launcher.THEMES",
            "com.novalauncher.THEME",
            "com.anddoes.launcher.THEME",
            "com.teslacoilsw.launcher.THEME",
            "com.fede.launcher.THEME_ICONPACK",
            "com.gau.go.launcherex.theme",
            "com.dlto.atom.launcher.THEME",
            "solo.launcher.THEME"
        )

        for (action in actions) {
            try {
                val intent = Intent(action)
                val resolveInfos = pm.queryIntentActivities(intent, 0)
                for (ri in resolveInfos) {
                    iconPackPackages.add(ri.activityInfo.packageName)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to query action $action: ${e.message}")
            }
        }

        // Fallback: Scan all installed packages on the system to verify if they have appfilter XML resources
        try {
            val allPackages = pm.getInstalledPackages(PackageManager.GET_META_DATA)
            for (pkgInfo in allPackages) {
                val pkgName = pkgInfo.packageName
                if (pkgName == context.packageName) continue
                if (iconPackPackages.contains(pkgName)) continue // already added

                try {
                    val appInfo = pm.getApplicationInfo(pkgName, PackageManager.GET_META_DATA)
                    val resources = pm.getResourcesForApplication(appInfo.packageName)
                    
                    var hasAppFilter = false
                    var appfilterResId = resources.getIdentifier("appfilter", "xml", pkgName)
                    if (appfilterResId == 0) {
                        appfilterResId = resources.getIdentifier("appfilter", "raw", pkgName)
                    }
                    
                    if (appfilterResId > 0) {
                        hasAppFilter = true
                    } else {
                        // Check assets
                        try {
                            resources.assets.open("appfilter.xml").use {
                                hasAppFilter = true
                            }
                        } catch (e: Exception) {
                            // Not in assets
                        }
                    }

                    if (hasAppFilter) {
                        iconPackPackages.add(pkgName)
                        Log.d(TAG, "Found icon pack via fallback scanner: $pkgName")
                    }
                } catch (e: Exception) {
                    // Ignore
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Fallback scanner failed: ${e.message}")
        }

        for (packageName in iconPackPackages) {
            try {
                val appInfo = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
                val resources = pm.getResourcesForApplication(appInfo.packageName)
                val label = appInfo.loadLabel(pm).toString()
                
                // Leverage mappingsCache to prevent expensive XML parsing when reloading settings screen
                val mappings = mappingsCache[packageName] ?: run {
                    val parsed = parseAppfilter(resources, packageName)
                    if (parsed.isNotEmpty()) {
                        mappingsCache[packageName] = parsed
                    }
                    parsed
                }

                if (mappings.isNotEmpty()) {
                    iconPacks.add(IconPackInfo(packageName, label, mappings))
                    Log.d(TAG, "Found icon pack: $packageName - $label (${mappings.size} mappings)")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse icon pack $packageName: ${e.message}")
            }
        }

        return iconPacks
    }

    /**
     * Parse appfilter.xml from an icon pack (checking xml, raw, and assets paths) and extract package -> drawable mappings.
     */
    private fun parseAppfilter(resources: Resources, packageName: String): Map<String, String> {
        val mappings = mutableMapOf<String, String>()

        // 1. Try xml resource
        try {
            val resId = resources.getIdentifier("appfilter", "xml", packageName)
            if (resId > 0) {
                val parser = resources.getXml(resId)
                val mappingsList = parseAppfilterXmlParser(parser)
                for ((pkg, drawable) in mappingsList) {
                    mappings[pkg] = drawable
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse appfilter xml resource for $packageName: ${e.message}")
        }

        // 2. Try raw resource
        if (mappings.isEmpty()) {
            try {
                val resId = resources.getIdentifier("appfilter", "raw", packageName)
                if (resId > 0) {
                    resources.openRawResource(resId).use { inputStream ->
                        val mappingsList = parseAppfilterXml(inputStream)
                        for ((pkg, drawable) in mappingsList) {
                            mappings[pkg] = drawable
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse appfilter raw resource for $packageName: ${e.message}")
            }
        }

        // 3. Try assets
        if (mappings.isEmpty()) {
            try {
                resources.assets.open("appfilter.xml").use { inputStream ->
                    val mappingsList = parseAppfilterXml(inputStream)
                    for ((pkg, drawable) in mappingsList) {
                        mappings[pkg] = drawable
                    }
                }
            } catch (e: Exception) {
                // Ignore if not in assets
            }
        }

        return mappings
    }

    /**
     * Parse appfilter.xml content using a general XmlPullParser.
     */
    private fun parseAppfilterXmlParser(parser: XmlPullParser): List<Pair<String, String>> {
        val mappings = mutableListOf<Pair<String, String>>()
        try {
            var eventType = parser.eventType
            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG && parser.name == "item") {
                    val component = parser.getAttributeValue(null, "component")
                    val drawable = parser.getAttributeValue(null, "drawable")

                    if (component != null && drawable != null) {
                        val packageName = extractPackageName(component)
                        if (packageName != null) {
                            mappings.add(packageName to drawable)
                            val activity = extractActivityName(component)
                            if (activity != null && activity != packageName) {
                                mappings.add(activity to drawable)
                            }
                        }
                    }
                }
                eventType = parser.next()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error parsing appfilter XML with parser: ${e.message}")
        }
        return mappings
    }

    /**
     * Parse appfilter.xml content from an input stream.
     */
    private fun parseAppfilterXml(inputStream: InputStream): List<Pair<String, String>> {
        return try {
            val factory = XmlPullParserFactory.newInstance()
            val parser = factory.newPullParser()
            parser.setInput(inputStream, "utf-8")
            parseAppfilterXmlParser(parser)
        } catch (e: Exception) {
            Log.w(TAG, "Error setting up appfilter XML: ${e.message}")
            emptyList()
        }
    }

    /**
     * Extract package name from component string.
     * Examples:
     * - "ComponentInfo{com.example.app/.MainActivity}" -> "com.example.app"
     * - "com.example.app/.MainActivity" -> "com.example.app"
     * - "com.example.app" -> "com.example.app"
     */
    private fun extractPackageName(component: String): String? {
        return when {
            component.startsWith("ComponentInfo{") -> {
                val start = "ComponentInfo{".length
                val end = component.indexOf("/", start)
                if (end > start) component.substring(start, end) else null
            }
            component.contains("/") -> component.substring(0, component.indexOf("/"))
            else -> component.takeIf { it.isNotEmpty() }
        }
    }

    /**
     * Extract full activity name from component string.
     * Examples:
     * - "ComponentInfo{com.example.app/.MainActivity}" -> "com.example.app/.MainActivity"
     * - "com.example.app/.MainActivity" -> "com.example.app/.MainActivity"
     */
    private fun extractActivityName(component: String): String? {
        return when {
            component.startsWith("ComponentInfo{") -> {
                val start = "ComponentInfo{".length
                val end = component.indexOf("}", start)
                if (end > start) component.substring(start, end) else null
            }
            component.contains("/") -> component
            else -> null
        }
    }

    /**
     * Get an icon from an icon pack by drawable resource name.
     * Returns Base64-encoded PNG.
     */
    fun getIconFromPack(
        iconPackPackage: String,
        drawableName: String,
        size: Int = 256
    ): String? {
        return try {
            val resources = context.packageManager.getResourcesForApplication(iconPackPackage)
            val resId = resources.getIdentifier(drawableName, "drawable", iconPackPackage)

            if (resId > 0) {
                val drawable = resources.getDrawable(resId, null)
                drawableToUri(context, drawable, size, iconPackPackage, drawableName)
            } else {
                Log.w(TAG, "Drawable not found: $drawableName in $iconPackPackage")
                null
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to get icon from pack: ${e.message}")
            null
        }
    }

    /**
     * Get the drawable name for a package from a specific icon pack.
     * Returns the drawable name if found, null otherwise.
     */
    fun getDrawableNameForPackage(
        iconPackPackage: String,
        targetPackage: String
    ): String? {
        return try {
            val cached = mappingsCache[iconPackPackage]
            if (cached != null) {
                return cached[targetPackage]
            }

            val resources = context.packageManager.getResourcesForApplication(iconPackPackage)
            val mappings = parseAppfilter(resources, iconPackPackage)
            mappingsCache[iconPackPackage] = mappings
            mappings[targetPackage]
        } catch (e: Exception) {
            Log.w(TAG, "Failed to get drawable name: ${e.message}")
            null
        }
    }

    private fun drawableToUri(context: Context, drawable: Drawable, size: Int, iconPack: String, drawableName: String): String? {
        try {
            val cacheDir = context.cacheDir
            val iconFile = java.io.File(cacheDir, "app_icon_${iconPack}_${drawableName}.png")
            if (iconFile.exists() && iconFile.length() > 0) {
                return "file://" + iconFile.absolutePath
            }

            val bitmap: Bitmap = if (drawable is android.graphics.drawable.BitmapDrawable && drawable.bitmap != null) {
                scaleBitmap(drawable.bitmap, size)
            } else {
                val newBitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(newBitmap)
                drawable.setBounds(0, 0, size, size)
                drawable.draw(canvas)
                newBitmap
            }

            val out = java.io.FileOutputStream(iconFile)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()
            return "file://" + iconFile.absolutePath
        } catch (e: Exception) {
            Log.w(TAG, "Failed to cache icon pack drawable: ${e.message}")
            return null
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, size: Int): Bitmap {
        if (bitmap.width == size && bitmap.height == size) return bitmap
        return Bitmap.createScaledBitmap(bitmap, size, size, true)
    }
}
