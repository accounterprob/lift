import Foundation
import HealthKit

protocol HealthKitServicing {
    func status() -> [String: Any]
    func requestAuthorization() async throws -> [String: Any]
    func perform(operation: [String: Any]) async throws -> [String: Any]
    func queryWorkouts(range: [String: Any]) async throws -> [[String: Any]]
    func queryRecentRespiratoryEvents() async throws -> [[String: Any]]
    func queryStateOfMind(_ payload: [String: Any]) async throws -> [String: Any]
    func deleteLiftObjects(_ payload: [String: Any]) async throws -> [String: Any]
    func reconcileLinks(_ links: [[String: Any]]) async throws -> [[String: Any]]
}

final class NativeHealthKitService: HealthKitServicing {
    private let store = HKHealthStore()
    private let namespace = Bundle.main.bundleIdentifier ?? "com.accounterprob.lift"
    private var defaultSourceBundleIdentifier: String { HKSource.default().bundleIdentifier }

    func status() -> [String: Any] {
        guard HKHealthStore.isHealthDataAvailable() else {
            return [
                "available": false,
                "nativeApp": true,
                "writesEnabled": false,
                "authorization": unavailableAuthorization(),
                "message": "Apple Health is not available on this device.",
            ]
        }
        var authorization: [String: String] = [:]
        for (kind, type) in sampleTypesByKind() {
            authorization[kind] = authorizationName(store.authorizationStatus(for: type))
        }
        if #unavailable(iOS 18.0) { authorization["workoutEffort"] = "unavailable" }
        return [
            "available": true,
            "nativeApp": true,
            "writesEnabled": true,
            "authorization": authorization,
            "message": "Read access can’t be inferred from an empty query; Lift only reports known write authorization.",
        ]
    }

    func requestAuthorization() async throws -> [String: Any] {
        guard HKHealthStore.isHealthDataAvailable() else { throw HealthBridgeError.healthDataUnavailable }
        let types = Set(sampleTypesByKind().values)
        try await store.requestAuthorization(toShare: types, read: types)
        return status()
    }

    func perform(operation: [String: Any]) async throws -> [String: Any] {
        guard HKHealthStore.isHealthDataAvailable() else { throw HealthBridgeError.healthDataUnavailable }
        guard
            let operationType = operation["operationType"] as? String,
            let entityKind = operation["entityKind"] as? String,
            let syncIdentifier = operation["syncIdentifier"] as? String,
            let payload = operation["payload"] as? [String: Any]
        else { throw HealthBridgeError.invalidPayload }
        let version = integer(operation["syncVersion"]) ?? 1
        let uuids: [UUID]
        switch operationType {
        case "saveWorkout":
            uuids = [try await saveWorkout(payload: payload, syncIdentifier: syncIdentifier, version: version).uuid]
        case "saveWorkoutEffort":
            guard #available(iOS 18.0, *) else { throw HealthBridgeError.unsupported }
            uuids = [try await saveWorkoutEffort(payload: payload, syncIdentifier: syncIdentifier, version: version).uuid]
        case "saveStateOfMind":
            uuids = [try await saveStateOfMind(payload: payload, syncIdentifier: syncIdentifier, version: version).uuid]
        case "saveInhalerUsage":
            uuids = [try await saveInhalerUsage(payload: payload, syncIdentifier: syncIdentifier, version: version).uuid]
        case "saveRespiratorySymptom":
            uuids = [try await saveSymptom(kind: entityKind, payload: payload, syncIdentifier: syncIdentifier, version: version).uuid]
        default: throw HealthBridgeError.unsupported
        }
        return ["objectUUIDs": uuids.map(\.uuidString), "syncIdentifier": syncIdentifier, "syncVersion": version]
    }

    func queryWorkouts(range: [String: Any]) async throws -> [[String: Any]] {
        guard HKHealthStore.isHealthDataAvailable() else { return [] }
        guard let startMS = double(range["start"]), let endMS = double(range["end"]) else { throw HealthBridgeError.invalidPayload }
        let datePredicate = HKQuery.predicateForSamples(
            withStart: Date(milliseconds: startMS),
            end: Date(milliseconds: endMS),
            options: [.strictStartDate, .strictEndDate]
        )
        let samples = try await query(type: HKObjectType.workoutType(), predicate: datePredicate, limit: HKObjectQueryNoLimit)
        return samples.compactMap { sample in
            guard let workout = sample as? HKWorkout else { return nil }
            return [
                "uuid": workout.uuid.uuidString,
                "start": workout.startDate.milliseconds,
                "end": workout.endDate.milliseconds,
                "activityType": workout.workoutActivityType.rawValue,
                "sourceName": workout.sourceRevision.source.name,
                "sourceBundleIdentifier": workout.sourceRevision.source.bundleIdentifier,
                "createdByLift": workout.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier,
                "syncIdentifier": workout.metadata?[HKMetadataKeySyncIdentifier] as? String ?? NSNull(),
                "syncVersion": integer(workout.metadata?[HKMetadataKeySyncVersion]) ?? 0,
            ]
        }
    }

    func queryRecentRespiratoryEvents() async throws -> [[String: Any]] {
        guard HKHealthStore.isHealthDataAvailable() else { return [] }
        let kinds = ["inhalerUsage", "wheezing", "shortnessOfBreath", "coughing", "chestTightnessOrPain"]
        var result: [[String: Any]] = []
        for kind in kinds {
            guard let type = sampleTypesByKind()[kind] else { continue }
            let samples = try await query(type: type, predicate: nil, limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)])
            guard let sample = samples.first else { continue }
            let displayValue: String
            if let quantity = sample as? HKQuantitySample {
                displayValue = "\(Int(quantity.quantity.doubleValue(for: .count()))) puff(s)"
            } else if let category = sample as? HKCategorySample {
                displayValue = severityName(category.value)
            } else { continue }
            result.append(["entityKind": kind, "timestamp": sample.startDate.milliseconds, "displayValue": displayValue])
        }
        return result.sorted { (double($0["timestamp"]) ?? 0) > (double($1["timestamp"]) ?? 0) }
    }

    func queryStateOfMind(_ payload: [String: Any]) async throws -> [String: Any] {
        guard let identifier = payload["syncIdentifier"] as? String else { throw HealthBridgeError.invalidPayload }
        let matches = try await samples(syncIdentifier: identifier, type: HKObjectType.stateOfMindType())
            .compactMap { $0 as? HKStateOfMind }
            .filter { $0.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier }
            .sorted { $0.date > $1.date }
        guard let sample = matches.first else { return ["found": false] }
        return ["found": true, "valence": sample.valence, "timestamp": sample.date.milliseconds]
    }

    func deleteLiftObjects(_ payload: [String: Any]) async throws -> [String: Any] {
        let identifiers = payload["syncIdentifiers"] as? [String] ?? []
        var objects: [HKObject] = []
        for identifier in identifiers {
            for type in sampleTypesByKind().values {
                let matches = try await samples(syncIdentifier: identifier, type: type)
                objects.append(contentsOf: matches.filter { $0.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier })
            }
        }
        if !objects.isEmpty { try await store.delete(objects) }
        return ["deletedCount": objects.count]
    }

    func reconcileLinks(_ links: [[String: Any]]) async throws -> [[String: Any]] {
        var results: [[String: Any]] = []
        for link in links {
            guard let identifier = link["syncIdentifier"] as? String,
                  let kind = link["entityKind"] as? String,
                  let type = sampleTypesByKind()[kind]
            else { continue }
            let objects = try await samples(syncIdentifier: identifier, type: type)
                .filter { $0.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier }
            results.append([
                "syncIdentifier": identifier,
                "found": !objects.isEmpty,
                "definitive": false,
                "objectUUIDs": objects.map { $0.uuid.uuidString },
            ])
        }
        return results
    }

    private func saveWorkout(payload: [String: Any], syncIdentifier: String, version: Int) async throws -> HKWorkout {
        if let existing = try await currentObject(syncIdentifier: syncIdentifier, type: HKObjectType.workoutType(), minimumVersion: version) as? HKWorkout {
            if #available(iOS 18.0, *) { try await reestablishEffortIfPresent(for: existing, workoutID: payload["workoutID"] as? String) }
            return existing
        }
        guard let startMS = double(payload["start"]), let endMS = double(payload["end"]), endMS > startMS else { throw HealthBridgeError.invalidInterval }
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .traditionalStrengthTraining
        let builder = HKWorkoutBuilder(healthStore: store, configuration: configuration, device: nil)
        let metadata = metadata(
            syncIdentifier: syncIdentifier,
            version: version,
            localID: payload["workoutID"] as? String,
            context: nil,
            timeZone: payload["timeZone"] as? String,
            localIDMetadataKey: "liftWorkoutID",
            extras: [
                "workoutName": payload["name"] as? String,
                "backfilled": payload["backfilled"] as? Bool,
                "migrationVersion": integer(payload["migrationVersion"]),
            ]
        )
        try await builder.beginCollection(at: Date(milliseconds: startMS))
        try await builder.addMetadata(metadata)
        try await builder.endCollection(at: Date(milliseconds: endMS))
        guard let workout = try await builder.finishWorkout() else { throw HealthBridgeError.temporarilyUnavailable }
        if #available(iOS 18.0, *) { try await reestablishEffortIfPresent(for: workout, workoutID: payload["workoutID"] as? String) }
        return workout
    }

    @available(iOS 18.0, *)
    private func saveWorkoutEffort(payload: [String: Any], syncIdentifier: String, version: Int) async throws -> HKQuantitySample {
        let type = HKQuantityType(.workoutEffortScore)
        if let existing = try await currentObject(syncIdentifier: syncIdentifier, type: type, minimumVersion: version) as? HKQuantitySample { return existing }
        guard let value = double(payload["value"]), (1...10).contains(value),
              let workoutIdentifier = payload["workoutSyncIdentifier"] as? String,
              let workout = try await samples(syncIdentifier: workoutIdentifier, type: HKObjectType.workoutType()).compactMap({ $0 as? HKWorkout }).first,
              workout.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier
        else { throw HealthBridgeError.missingWorkoutDependency }
        let start = Date(milliseconds: double(payload["start"]) ?? workout.startDate.milliseconds)
        let end = Date(milliseconds: double(payload["end"]) ?? workout.endDate.milliseconds)
        let sample = HKQuantitySample(
            type: type,
            quantity: HKQuantity(unit: .appleEffortScore(), doubleValue: value),
            start: start,
            end: end,
            metadata: metadata(syncIdentifier: syncIdentifier, version: version, localID: payload["effortEventID"] as? String, context: "postWorkout", timeZone: payload["timeZone"] as? String, extras: ["relatedWorkoutID": payload["workoutID"] as? String])
        )
        _ = try await store.relateWorkoutEffortSample(sample, with: workout, activity: nil)
        return sample
    }

    private func saveStateOfMind(payload: [String: Any], syncIdentifier: String, version: Int) async throws -> HKStateOfMind {
        let type = HKObjectType.stateOfMindType()
        if let existing = try await currentObject(syncIdentifier: syncIdentifier, type: type, minimumVersion: version) as? HKStateOfMind { return existing }
        guard let valence = double(payload["valence"]), (-1...1).contains(valence), let timestamp = double(payload["timestamp"]) else { throw HealthBridgeError.invalidPayload }
        let context = payload["context"] as? String
        let associations: [HKStateOfMind.Association] = ["preWorkout", "postWorkout"].contains(context) ? [.fitness] : []
        let sample = HKStateOfMind(
            date: Date(milliseconds: timestamp),
            kind: .momentaryEmotion,
            valence: valence,
            labels: [],
            associations: associations,
            metadata: metadata(syncIdentifier: syncIdentifier, version: version, localID: payload["eventID"] as? String, context: context, timeZone: payload["timeZone"] as? String, extras: ["relatedWorkoutID": payload["relatedWorkoutID"] as? String])
        )
        try await store.save(sample)
        return sample
    }

    private func saveInhalerUsage(payload: [String: Any], syncIdentifier: String, version: Int) async throws -> HKQuantitySample {
        let type = HKQuantityType(.inhalerUsage)
        if let existing = try await currentObject(syncIdentifier: syncIdentifier, type: type, minimumVersion: version) as? HKQuantitySample { return existing }
        guard let puffs = double(payload["puffs"]), puffs > 0, let timestamp = double(payload["timestamp"]) else { throw HealthBridgeError.invalidPayload }
        let date = Date(milliseconds: timestamp)
        let sample = HKQuantitySample(
            type: type,
            quantity: HKQuantity(unit: .count(), doubleValue: puffs),
            start: date,
            end: date,
            metadata: eventMetadata(payload: payload, syncIdentifier: syncIdentifier, version: version)
        )
        try await store.save(sample)
        return sample
    }

    private func saveSymptom(kind: String, payload: [String: Any], syncIdentifier: String, version: Int) async throws -> HKCategorySample {
        guard let type = sampleTypesByKind()[kind] as? HKCategoryType else { throw HealthBridgeError.unsupported }
        if let existing = try await currentObject(syncIdentifier: syncIdentifier, type: type, minimumVersion: version) as? HKCategorySample { return existing }
        guard let timestamp = double(payload["timestamp"]), let severity = payload["severity"] as? String else { throw HealthBridgeError.invalidPayload }
        let date = Date(milliseconds: timestamp)
        let sample = HKCategorySample(type: type, value: severityValue(severity).rawValue, start: date, end: date, metadata: eventMetadata(payload: payload, syncIdentifier: syncIdentifier, version: version))
        try await store.save(sample)
        return sample
    }

    @available(iOS 18.0, *)
    private func reestablishEffortIfPresent(for workout: HKWorkout, workoutID: String?) async throws {
        guard let workoutID else { return }
        let identifier = "\(namespace).workoutEffort.\(workoutID):effort"
        let type = HKQuantityType(.workoutEffortScore)
        guard let effort = try await samples(syncIdentifier: identifier, type: type).first else { return }
        _ = try await store.relateWorkoutEffortSample(effort, with: workout, activity: nil)
    }

    private func eventMetadata(payload: [String: Any], syncIdentifier: String, version: Int) -> [String: Any] {
        metadata(
            syncIdentifier: syncIdentifier,
            version: version,
            localID: payload["asthmaEventID"] as? String,
            context: payload["context"] as? String,
            timeZone: payload["timeZone"] as? String,
            extras: ["relatedWorkoutID": payload["relatedWorkoutID"] as? String]
        )
    }

    private func metadata(
        syncIdentifier: String,
        version: Int,
        localID: String?,
        context: String?,
        timeZone: String?,
        localIDMetadataKey: String = "liftEventID",
        extras: [String: Any?] = [:]
    ) -> [String: Any] {
        var values: [String: Any] = [
            HKMetadataKeySyncIdentifier: syncIdentifier,
            HKMetadataKeySyncVersion: version,
            HKMetadataKeyWasUserEntered: true,
            "\(namespace).schemaVersion": 1,
        ]
        if let localID {
            values[HKMetadataKeyExternalUUID] = syncIdentifier
            values["\(namespace).\(localIDMetadataKey)"] = localID
        }
        if let context { values["\(namespace).entryContext"] = context }
        if let timeZone { values[HKMetadataKeyTimeZone] = timeZone }
        for (key, value) in extras {
            if let value { values["\(namespace).\(key)"] = value }
        }
        return values
    }

    private func currentObject(syncIdentifier: String, type: HKSampleType, minimumVersion: Int) async throws -> HKSample? {
        try await samples(syncIdentifier: syncIdentifier, type: type).first { sample in
            sample.sourceRevision.source.bundleIdentifier == defaultSourceBundleIdentifier &&
            (integer(sample.metadata?[HKMetadataKeySyncVersion]) ?? 0) >= minimumVersion
        }
    }

    private func samples(syncIdentifier: String, type: HKSampleType) async throws -> [HKSample] {
        let predicate = HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeySyncIdentifier, allowedValues: [syncIdentifier])
        return try await query(type: type, predicate: predicate, limit: HKObjectQueryNoLimit)
    }

    private func query(
        type: HKSampleType,
        predicate: NSPredicate?,
        limit: Int,
        sortDescriptors: [NSSortDescriptor]? = nil
    ) async throws -> [HKSample] {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: limit, sortDescriptors: sortDescriptors) { _, samples, error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: samples ?? []) }
            }
            store.execute(query)
        }
    }

    private func sampleTypesByKind() -> [String: HKSampleType] {
        var result: [String: HKSampleType] = [
            "workout": HKObjectType.workoutType(),
            "stateOfMind": HKObjectType.stateOfMindType(),
            "inhalerUsage": HKQuantityType(.inhalerUsage),
            "wheezing": HKCategoryType(.wheezing),
            "shortnessOfBreath": HKCategoryType(.shortnessOfBreath),
            "coughing": HKCategoryType(.coughing),
            "chestTightnessOrPain": HKCategoryType(.chestTightnessOrPain),
        ]
        if #available(iOS 18.0, *) { result["workoutEffort"] = HKQuantityType(.workoutEffortScore) }
        return result
    }

    private func unavailableAuthorization() -> [String: String] {
        Dictionary(uniqueKeysWithValues: ["workout", "workoutEffort", "stateOfMind", "inhalerUsage", "wheezing", "shortnessOfBreath", "coughing", "chestTightnessOrPain"].map { ($0, "unavailable") })
    }

    private func authorizationName(_ value: HKAuthorizationStatus) -> String {
        switch value {
        case .sharingAuthorized: "sharingAuthorized"
        case .sharingDenied: "sharingDenied"
        case .notDetermined: "notDetermined"
        @unknown default: "unknown"
        }
    }

    private func severityValue(_ value: String) -> HKCategoryValueSeverity {
        switch value {
        case "mild": .mild
        case "moderate": .moderate
        case "severe": .severe
        default: .unspecified
        }
    }

    private func severityName(_ rawValue: Int) -> String {
        switch HKCategoryValueSeverity(rawValue: rawValue) {
        case .mild: "Mild"
        case .moderate: "Moderate"
        case .severe: "Severe"
        case .unspecified: "Unspecified"
        default: "Unspecified"
        }
    }

    static func safeErrorCode(_ error: Error) -> String {
        if let bridgeError = error as? HealthBridgeError {
            switch bridgeError {
            case .unsupported: return "unsupported"
            case .healthDataUnavailable: return "healthDataUnavailable"
            case .invalidPayload, .invalidInterval: return "invalidPayload"
            case .missingWorkoutDependency: return "missingDependency"
            case .temporarilyUnavailable: return "temporarilyUnavailable"
            }
        }
        let nsError = error as NSError
        if nsError.domain == HKErrorDomain { return "healthKit.\(nsError.code)" }
        if nsError.domain == NSCocoaErrorDomain { return "storage.\(nsError.code)" }
        return "operationFailed"
    }

    static func userMessage(for error: Error) -> String {
        if let bridgeError = error as? HealthBridgeError { return bridgeError.errorDescription ?? "Apple Health could not complete this operation." }
        let nsError = error as NSError
        if nsError.domain == HKErrorDomain {
            switch HKError.Code(rawValue: nsError.code) {
            case .errorAuthorizationDenied: return "Apple Health did not allow this write. Review access in Settings."
            case .errorHealthDataRestricted: return "Health data access is restricted on this device."
            case .errorHealthDataUnavailable: return "Health data is temporarily unavailable. Lift kept the entry for retry."
            case .errorDatabaseInaccessible: return "Health data is temporarily inaccessible, possibly because the device is locked."
            default: return "Apple Health could not complete this operation. Lift kept the entry for retry."
            }
        }
        return "Apple Health could not complete this operation. Lift kept the entry for retry."
    }
}

enum HealthBridgeError: LocalizedError {
    case healthDataUnavailable, invalidPayload, invalidInterval, unsupported, missingWorkoutDependency, temporarilyUnavailable
    var errorDescription: String? {
        switch self {
        case .healthDataUnavailable: "Apple Health is unavailable on this device."
        case .invalidPayload: "Lift could not validate this Health entry."
        case .invalidInterval: "The workout start and end time are invalid."
        case .unsupported: "This Health data type is not supported on this iOS version."
        case .missingWorkoutDependency: "The Apple Health workout must synchronize before its effort score."
        case .temporarilyUnavailable: "Health data is temporarily unavailable. Lift kept the entry for retry."
        }
    }
}

private extension Date {
    init(milliseconds: Double) { self.init(timeIntervalSince1970: milliseconds / 1_000) }
    var milliseconds: Double { timeIntervalSince1970 * 1_000 }
}

private func double(_ value: Any?) -> Double? {
    if let number = value as? NSNumber { return number.doubleValue }
    if let value = value as? Double { return value }
    if let value = value as? Int { return Double(value) }
    return nil
}

private func integer(_ value: Any?) -> Int? {
    if let number = value as? NSNumber { return number.intValue }
    if let value = value as? Int { return value }
    return nil
}
