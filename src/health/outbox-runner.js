import { classifyHealthError, orderReadyOperations } from './domain.js';

export async function drainOutbox({
  loadOperations,
  service,
  markAttempt,
  commitSuccess,
  commitFailure,
  onProgress = null,
  shouldCancel = () => false,
}) {
  let succeeded = 0;
  let failed = 0;
  let processed = 0;
  const completed = new Set();
  const attempted = new Set();
  while (!shouldCancel()) {
    const all = await loadOperations();
    const ready = orderReadyOperations(all, completed).filter((operation) => !attempted.has(operation.id));
    if (ready.length === 0) break;
    const operation = ready[0];
    attempted.add(operation.id);
    operation.syncStatus = 'syncing';
    operation.attemptCount = Number(operation.attemptCount ?? 0) + 1;
    operation.lastAttemptAt = Date.now();
    await markAttempt(operation);
    onProgress?.({ phase: 'attempt', operation, processed, total: all.length });
    try {
      const result = await service.performOperation(operation);
      await commitSuccess(operation, result);
      completed.add(operation.id);
      succeeded += 1;
      processed += 1;
      onProgress?.({ phase: 'success', operation, processed, total: all.length });
    } catch (error) {
      const classified = classifyHealthError(error);
      operation.syncStatus = 'failed';
      operation.lastError = classified.userMessage;
      operation.requiresUserAttention = classified.requiresUserAttention;
      await commitFailure(operation, classified.userMessage);
      failed += 1;
      processed += 1;
      onProgress?.({ phase: 'failure', operation, error: classified.userMessage, processed, total: all.length });
    }
  }
  return { processed, succeeded, failed, canceled: shouldCancel() };
}
