/**
 * UploadQueue.ts
 * Phase 2: In-memory upload queue for location batches
 * TypeScript-only, pure functions with internal state
 */

import type { LocPoint } from './LocationTracker';

// Types
export interface BatchPayload {
  tripId: string;
  points: LocPoint[];
}

// Internal state - in-memory queue
const queue: BatchPayload[] = [];

/**
 * Add a batch to the upload queue
 * @param batch - The batch payload to enqueue
 */
export function enqueue(batch: BatchPayload): void {
  if (!batch || !batch.tripId || !Array.isArray(batch.points) || batch.points.length === 0) {
    console.warn('[UploadQueue] Invalid batch payload, skipping enqueue');
    return;
  }
  
  queue.push({
    tripId: batch.tripId,
    points: [...batch.points], // Defensive copy
  });
  
  console.log(`[UploadQueue] Enqueued batch: tripId=${batch.tripId}, points=${batch.points.length}, queueSize=${queue.length}`);
}

/**
 * Drain the queue by processing all batches
 * Clears queue ONLY after flush resolves successfully
 * @param flush - Async function to process batches
 */
export async function drain(flush: (batches: BatchPayload[]) => Promise<void>): Promise<void> {
  if (queue.length === 0) {
    console.log('[UploadQueue] Queue is empty, nothing to drain');
    return;
  }
  
  // Create a copy of current queue items
  const batchesToFlush = [...queue];
  
  console.log(`[UploadQueue] Draining ${batchesToFlush.length} batches...`);
  
  try {
    // Call flush with the batches
    await flush(batchesToFlush);
    
    // Only clear the queue after successful flush
    // Remove only the items we flushed (in case new items were added during flush)
    const flushedCount = batchesToFlush.length;
    queue.splice(0, flushedCount);
    
    console.log(`[UploadQueue] Successfully drained ${flushedCount} batches, remaining=${queue.length}`);
  } catch (error) {
    console.error('[UploadQueue] Flush failed, keeping batches in queue:', error);
    throw error; // Re-throw to let caller handle
  }
}

/**
 * Get the current size of the queue
 * @returns Number of batches in the queue
 */
export function size(): number {
  return queue.length;
}

/**
 * Clear the queue (for testing or reset scenarios)
 * Use with caution - this discards all pending uploads
 */
export function clear(): void {
  const previousSize = queue.length;
  queue.length = 0;
  console.log(`[UploadQueue] Cleared ${previousSize} batches from queue`);
}

/**
 * Peek at the queue contents without modifying
 * @returns Copy of current queue contents
 */
export function peek(): BatchPayload[] {
  return queue.map(batch => ({
    tripId: batch.tripId,
    points: [...batch.points],
  }));
}

/**
 * Get total number of points across all batches
 * @returns Total point count
 */
export function totalPoints(): number {
  return queue.reduce((sum, batch) => sum + batch.points.length, 0);
}