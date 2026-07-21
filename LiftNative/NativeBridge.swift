import Foundation
import UIKit
import WebKit

@MainActor
final class NativeBridge: NSObject, WKScriptMessageHandler, UIDocumentPickerDelegate {
    static let handlerName = "liftNative"
    weak var webView: WKWebView?
    private let healthKit = NativeHealthKitService()
    private let notifications = NotificationService()
    private var exportContinuation: CheckedContinuation<[String: Any], Error>?
    private var exportDirectory: URL?
    private var exportFilename: String?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard
            message.name == Self.handlerName,
            let request = message.body as? [String: Any],
            let id = request["id"] as? String,
            let action = request["action"] as? String
        else { return }
        let payload = request["payload"] as? [String: Any] ?? [:]
        Task {
            do {
                let result = try await perform(action: action, payload: payload)
                respond(id: id, result: result)
            } catch {
                let message: String
                if action.hasPrefix("health.") {
                    message = NativeHealthKitService.userMessage(for: error)
                } else if let bridgeError = error as? BridgeError {
                    message = bridgeError.errorDescription ?? "Lift could not complete this operation."
                } else if let notificationError = error as? NotificationError {
                    message = notificationError.errorDescription ?? "Lift could not update the reminder."
                } else {
                    message = "Lift could not complete this operation. Please try again."
                }
                respond(id: id, error: [
                    "code": NativeHealthKitService.safeErrorCode(error),
                    "message": message,
                ])
            }
        }
    }

    private func perform(action: String, payload: [String: Any]) async throws -> Any {
        switch action {
        case "health.status": return healthKit.status()
        case "health.authorize": return try await healthKit.requestAuthorization()
        case "health.performOperation": return try await healthKit.perform(operation: payload)
        case "health.queryWorkouts": return try await healthKit.queryWorkouts(range: payload)
        case "health.queryRecentRespiratoryEvents": return try await healthKit.queryRecentRespiratoryEvents()
        case "health.queryStateOfMind": return try await healthKit.queryStateOfMind(payload)
        case "health.deleteLiftObjects": return try await healthKit.deleteLiftObjects(payload)
        case "health.reconcileLinks": return try await healthKit.reconcileLinks(payload["links"] as? [[String: Any]] ?? [])
        case "notifications.configureReminder": return try await notifications.configure(payload)
        case "app.openSettings":
            guard let url = URL(string: UIApplication.openSettingsURLString) else { return ["opened": false] }
            return ["opened": await UIApplication.shared.open(url)]
        case "files.exportBackup":
            guard let filename = payload["filename"] as? String, let json = payload["json"] as? String else {
                throw BridgeError.invalidPayload
            }
            return try await exportBackup(filename: filename, json: json)
        default: throw BridgeError.unsupportedAction
        }
    }

    private func respond(id: String, result: Any) {
        emit(["id": id, "ok": true, "result": result])
    }

    private func respond(id: String, error: [String: String]) {
        emit(["id": id, "ok": false, "error": error])
    }

    private func emit(_ response: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(response),
              let data = try? JSONSerialization.data(withJSONObject: response),
              let json = String(data: data, encoding: .utf8)
        else { return }
        webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('lift:native-response',{detail:\(json)}))")
    }

    private func exportBackup(filename: String, json: String) async throws -> [String: Any] {
        guard exportContinuation == nil else { throw BridgeError.exportAlreadyPresented }
        let safeName = URL(fileURLWithPath: filename).lastPathComponent
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let fileURL = directory.appendingPathComponent(safeName)
        guard let data = json.data(using: .utf8) else { throw BridgeError.invalidPayload }
        try data.write(to: fileURL, options: .atomic)
        guard let presenter = UIApplication.shared.activeKeyWindow?.rootViewController?.topmost else {
            throw BridgeError.noPresenter
        }
        let picker = UIDocumentPickerViewController(forExporting: [fileURL], asCopy: true)
        picker.delegate = self
        exportDirectory = directory
        exportFilename = safeName
        return try await withCheckedThrowingContinuation { continuation in
            exportContinuation = continuation
            presenter.present(picker, animated: true)
        }
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        finishExport(.success(["filename": exportFilename ?? urls.first?.lastPathComponent ?? "lift-backup.json"]))
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finishExport(.failure(BridgeError.exportCanceled))
    }

    private func finishExport(_ result: Result<[String: Any], Error>) {
        let continuation = exportContinuation
        exportContinuation = nil
        exportFilename = nil
        if let exportDirectory { try? FileManager.default.removeItem(at: exportDirectory) }
        exportDirectory = nil
        continuation?.resume(with: result)
    }
}

enum BridgeError: LocalizedError {
    case invalidPayload, unsupportedAction, noPresenter, exportAlreadyPresented, exportCanceled
    var errorDescription: String? {
        switch self {
        case .invalidPayload: "The native request was incomplete."
        case .unsupportedAction: "This native action is not supported."
        case .noPresenter: "Lift could not present the Files export screen."
        case .exportAlreadyPresented: "A Files export is already open."
        case .exportCanceled: "The Files export was canceled."
        }
    }
}

private extension UIApplication {
    var activeKeyWindow: UIWindow? {
        connectedScenes.compactMap { $0 as? UIWindowScene }.filter { $0.activationState == .foregroundActive }.flatMap(\.windows).first { $0.isKeyWindow }
    }
}

private extension UIViewController {
    var topmost: UIViewController {
        if let presentedViewController { return presentedViewController.topmost }
        if let navigation = self as? UINavigationController { return navigation.visibleViewController?.topmost ?? navigation }
        if let tabs = self as? UITabBarController { return tabs.selectedViewController?.topmost ?? tabs }
        return self
    }
}
