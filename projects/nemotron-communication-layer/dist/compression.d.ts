import { Message, CompactedMessage } from './types';
export declare class CompressionPipeline {
    private classifier;
    compress(message: Message): CompactedMessage;
    private extractCriticalInfo;
    private removeRedundancy;
    private aggregateDetails;
    private trimToTarget;
}
