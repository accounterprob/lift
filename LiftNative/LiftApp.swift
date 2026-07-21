import SwiftUI
import UserNotifications

@main
struct LiftApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            WebAppView()
                .ignoresSafeArea()
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        guard response.notification.request.identifier == NotificationService.reminderIdentifier else { return }
        await MainActor.run {
            UserDefaults.standard.set(true, forKey: NotificationService.pendingCheckInKey)
            NotificationCenter.default.post(name: .liftOpenCheckIn, object: nil)
        }
    }
}

extension Notification.Name {
    static let liftOpenCheckIn = Notification.Name("LiftOpenCheckIn")
}
