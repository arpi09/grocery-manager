package com.skaffu.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * Opens receipt import when user shares PDF/image from another app (Kivra, Files, …).
 * WebView lands on /scan with share_target source — same entry as PWA share_target.
 */
public class MainActivity extends BridgeActivity {

    private static final String SHARE_SCAN_PATH =
        "/scan?mode=receipt&source=share_target";

    private boolean pendingShareNavigation = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isShareIntent(getIntent())) {
            pendingShareNavigation = true;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (isShareIntent(intent)) {
            pendingShareNavigation = true;
            navigateToShareScan();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        navigateToShareScan();
    }

    private boolean isShareIntent(Intent intent) {
        if (intent == null) {
            return false;
        }
        if (!Intent.ACTION_SEND.equals(intent.getAction())) {
            return false;
        }
        String type = intent.getType();
        if (type == null) {
            return false;
        }
        return "application/pdf".equals(type) || type.startsWith("image/");
    }

    private void navigateToShareScan() {
        if (!pendingShareNavigation || getBridge() == null) {
            return;
        }
        pendingShareNavigation = false;
        getBridge()
            .getWebView()
            .post(() -> getBridge().getWebView().loadUrl(getServerBaseUrl() + SHARE_SCAN_PATH));
    }

    private String getServerBaseUrl() {
        return "https://skaffu.com";
    }
}
