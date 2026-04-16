import { Request, Response } from 'express';

// BUG-008: Missing await
export async function handleDataCreate(req: Request, res: Response) {
  const record = req.body;
  processRecordAsync(record);  // Missing await!
  res.status(201).json({ success: true });
}

async function processRecordAsync(record: any): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

// BUG-007: Typo in error message
export function handleProcessingError(error: Error): string {
  return 'Unabel to process: ' + error.message;  // "Unabel" typo
}
