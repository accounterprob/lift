import Foundation
import UserNotifications

final class NotificationService {
    static let reminderIdentifier = "com.accounterprob.lift.daily-check-in"
    static let pendingCheckInKey = "com.accounterprob.lift.pending-check-in"

    func configure(_ payload: [String: Any]) async throws -> [String: Any] {
        let center = UNUserNotificationCenter.current()
        let enabled = payload["enabled"] as? Bool ?? false
        center.removePendingNotificationRequests(withIdentifiers: [Self.reminderIdentifier])
        guard enabled else { return ["enabled": false, "time": payload["time"] as? String ?? "09:00"] }

        let granted = try await center.requestAuthorization(options: [.alert, .sound])
        guard granted else { throw NotificationError.permissionNotGranted }
        let time = payload["time"] as? String ?? "09:00"
        let parts = time.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2, (0...23).contains(parts[0]), (0...59).contains(parts[1]) else {
            throw NotificationError.invalidTime
        }
        let content = UNMutableNotificationContent()
        content.title = "Lift check-in"
        content.body = "Take ten seconds to record how you feel right now."
        content.sound = .default
        content.userInfo = ["route": "check-in"]
        let trigger = UNCalendarNotificationTrigger(dateMatching: DateComponents(hour: parts[0], minute: parts[1]), repeats: true)
        try await center.add(UNNotificationRequest(identifier: Self.reminderIdentifier, content: content, trigger: trigger))
        return ["enabled": true, "time": time]
    }
}

enum NotificationError: LocalizedError {
    case permissionNotGranted, invalidTime
    var errorDescription: String? {
        switch self {
        case .permissionNotGranted: "Notification permission was not granted."
        case .invalidTime: "Choose a valid reminder time."
        }
    }
}
