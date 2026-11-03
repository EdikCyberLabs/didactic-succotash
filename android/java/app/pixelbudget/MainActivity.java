package app.pixelbudget;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

/**
 * Coquille native : une WebView qui affiche l'application web embarquée dans l'APK
 * (dossier assets/www). Les fichiers sont servis sous une origine https privée
 * (appassets.androidplatform.net, réservée par Android à cet usage), ce qui permet
 * aux modules JavaScript et au stockage local de fonctionner sans connexion.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyBarColor(Color.parseColor("#F2B33D"));

        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(debuggable);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F2B33D"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);

        // WebChromeClient : active les boîtes de dialogue JS (confirm) utilisées par l'app.
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new AssetClient());
        web.addJavascriptInterface(new Bridge(), "PixelNative");
        setContentView(web);

        // Toutes les données vivent dans le stockage local de la WebView : on recharge simplement l'app.
        web.loadUrl(START_URL);
    }

    /** Retour Android : délégué à l'app web (fermer une feuille, revenir à l'accueil), sinon on quitte. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.pixelBack ? window.pixelBack() : false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String handled) {
                if (!"true".equals(handled)) finish();
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    private void applyBarColor(int color) {
        Window w = getWindow();
        w.setStatusBarColor(color);
        w.setNavigationBarColor(color);
        double luminance = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
        View decor = w.getDecorView();
        int flags = decor.getSystemUiVisibility();
        int lightStatus = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        int lightNav = 0x00000010; // View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR (API 26)
        boolean light = luminance > 0.6;
        flags = light ? flags | lightStatus : flags & ~lightStatus;
        if (Build.VERSION.SDK_INT >= 26) flags = light ? flags | lightNav : flags & ~lightNav;
        decor.setSystemUiVisibility(flags);
    }

    /** Pont exposé à JavaScript sous le nom window.PixelNative. */
    private class Bridge {
        @JavascriptInterface
        public void setStatusBarColor(final String hex) {
            final int color;
            try {
                color = Color.parseColor(hex);
            } catch (IllegalArgumentException e) {
                return;
            }
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyBarColor(color);
                }
            });
        }
    }

    /** Sert les fichiers de assets/www ; ouvre les liens externes dans le navigateur. */
    private class AssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (!HOST.equals(url.getHost())) return null;
            String path = url.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
            if (path.contains("..")) return notFound();
            try {
                InputStream in = getAssets().open("www" + path);
                String mime = mimeType(path);
                String encoding = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") || mime.endsWith("svg+xml") ? "utf-8" : null;
                return new WebResourceResponse(mime, encoding, in);
            } catch (IOException e) {
                return notFound();
            }
        }

        // Variante « String » : disponible dès l'API 23 et appelée par défaut sur les versions récentes.
        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String rawUrl) {
            Uri url = Uri.parse(rawUrl);
            if (HOST.equals(url.getHost())) return false;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url));
            } catch (ActivityNotFoundException ignored) {
                // aucune app pour ouvrir ce lien
            }
            return true;
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                Collections.<String, String>emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    private static String mimeType(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
