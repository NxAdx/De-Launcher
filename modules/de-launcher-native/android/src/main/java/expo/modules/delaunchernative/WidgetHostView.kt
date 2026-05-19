package expo.modules.delaunchernative

import android.appwidget.AppWidgetHost
import android.appwidget.AppWidgetHostView
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProviderInfo
import android.content.Context
import android.widget.FrameLayout
import android.view.ViewGroup

class WidgetHostView(context: Context) : FrameLayout(context) {
    private var appWidgetId: Int = -1
    private var hostView: AppWidgetHostView? = null
    
    // We will get these injected or accessed via singleton
    var appWidgetHost: AppWidgetHost? = null
    var appWidgetManager: AppWidgetManager? = null

    fun setAppWidgetId(id: Int) {
        if (appWidgetId == id) return
        this.appWidgetId = id
        
        removeAllViews()
        hostView = null

        val host = appWidgetHost ?: return
        val manager = appWidgetManager ?: return

        if (id != -1) {
            val appWidgetInfo = manager.getAppWidgetInfo(id)
            if (appWidgetInfo != null) {
                hostView = host.createView(context, id, appWidgetInfo).apply {
                    layoutParams = LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
                addView(hostView)
            }
        }
    }
}
