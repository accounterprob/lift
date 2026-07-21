import SwiftUI
import WebKit

struct WebAppView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(context.coordinator.bridge, name: NativeBridge.handlerName)
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        context.coordinator.bridge.webView = webView
        context.coordinator.webView = webView
        context.coordinator.activeObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak webView] _ in
            webView?.evaluateJavaScript("window.dispatchEvent(new Event('lift:native-active'))")
        }
        context.coordinator.checkInObserver = NotificationCenter.default.addObserver(
            forName: .liftOpenCheckIn,
            object: nil,
            queue: .main
        ) { [weak webView] _ in
            UserDefaults.standard.set(false, forKey: NotificationService.pendingCheckInKey)
            webView?.evaluateJavaScript("window.dispatchEvent(new Event('lift:open-checkin'))")
        }
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") else {
            preconditionFailure("Bundled Web/index.html is missing")
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: NativeBridge.handlerName)
        if let observer = coordinator.activeObserver { NotificationCenter.default.removeObserver(observer) }
        if let observer = coordinator.checkInObserver { NotificationCenter.default.removeObserver(observer) }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let bridge = NativeBridge()
        weak var webView: WKWebView?
        var activeObserver: NSObjectProtocol?
        var checkInObserver: NSObjectProtocol?

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.evaluateJavaScript("document.documentElement.classList.add('native-host')")
            if UserDefaults.standard.bool(forKey: NotificationService.pendingCheckInKey) {
                UserDefaults.standard.set(false, forKey: NotificationService.pendingCheckInKey)
                webView.evaluateJavaScript("window.dispatchEvent(new Event('lift:open-checkin'))")
            }
        }
    }
}
