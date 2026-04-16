import { describe, it, expect } from 'bun:test';
import { createBrainMessenger } from '../../../src/factory/BrainMessenger.js';
import type { BrainMessage } from '../../../src/factory/types.js';

describe('BrainMessenger', () => {
  describe('send and receive', () => {
    it('sends a message to a brain queue', () => {
      const messenger = createBrainMessenger();

      const msg: BrainMessage = {
        id: 'msg-1',
        from: 'architect',
        to: 'executor',
        type: 'handoff',
        priority: 'normal',
        payload: { phase: 'planning-complete' },
        timestamp: Date.now(),
        requiresAck: false,
      };

      messenger.send(msg);

      const received = messenger.receive('executor');
      expect(received.length).toBe(1);
      expect(received[0].id).toBe('msg-1');
      expect(received[0].from).toBe('architect');
    });

    it('drains the queue on receive', () => {
      const messenger = createBrainMessenger();

      messenger.send({
        id: 'msg-1', from: 'a', to: 'b', type: 'handoff',
        priority: 'normal', payload: {}, timestamp: Date.now(), requiresAck: false,
      });
      messenger.send({
        id: 'msg-2', from: 'a', to: 'b', type: 'alert',
        priority: 'high', payload: {}, timestamp: Date.now(), requiresAck: false,
      });

      const first = messenger.receive('b');
      expect(first.length).toBe(2);

      const second = messenger.receive('b');
      expect(second.length).toBe(0); // Queue drained
    });
  });

  describe('priority ordering', () => {
    it('orders messages by priority (critical > high > normal > low)', () => {
      const messenger = createBrainMessenger();

      messenger.send({
        id: 'low-1', from: 'a', to: 'b', type: 'handoff',
        priority: 'low', payload: {}, timestamp: Date.now(), requiresAck: false,
      });
      messenger.send({
        id: 'critical-1', from: 'a', to: 'b', type: 'alert',
        priority: 'critical', payload: {}, timestamp: Date.now(), requiresAck: false,
      });
      messenger.send({
        id: 'normal-1', from: 'a', to: 'b', type: 'handoff',
        priority: 'normal', payload: {}, timestamp: Date.now(), requiresAck: false,
      });
      messenger.send({
        id: 'high-1', from: 'a', to: 'b', type: 'request',
        priority: 'high', payload: {}, timestamp: Date.now(), requiresAck: false,
      });

      const received = messenger.receive('b');
      expect(received[0].id).toBe('critical-1');
      expect(received[1].id).toBe('high-1');
      expect(received[2].id).toBe('normal-1');
      expect(received[3].id).toBe('low-1');
    });
  });

  describe('waitForAck', () => {
    it('resolves true when ack is received', async () => {
      const messenger = createBrainMessenger();

      // Send a message that requires ack
      messenger.send({
        id: 'msg-ack-1', from: 'architect', to: 'executor', type: 'request',
        priority: 'high', payload: {}, timestamp: Date.now(), requiresAck: true,
      });

      // Simulate executor sending ack back
      messenger.send({
        id: 'msg-ack-1', from: 'executor', to: 'architect', type: 'ack',
        priority: 'high', payload: { acked: true }, timestamp: Date.now(), requiresAck: false,
      });

      const result = await messenger.waitForAck('msg-ack-1', 1000);
      expect(result).toBe(true);
    });

    it('resolves false on timeout', async () => {
      const messenger = createBrainMessenger();

      // Send message but never send ack
      messenger.send({
        id: 'msg-timeout', from: 'architect', to: 'executor', type: 'request',
        priority: 'normal', payload: {}, timestamp: Date.now(), requiresAck: true,
      });

      const result = await messenger.waitForAck('msg-timeout', 50);
      expect(result).toBe(false);
    });
  });

  describe('auto-generated IDs', () => {
    it('generates message ID if not provided', () => {
      const messenger = createBrainMessenger();

      messenger.send({
        id: '', from: 'a', to: 'b', type: 'handoff',
        priority: 'normal', payload: {}, timestamp: Date.now(), requiresAck: false,
      } as BrainMessage);

      const received = messenger.receive('b');
      expect(received[0].id).toBeTruthy();
      expect(received[0].id.startsWith('msg_')).toBe(true);
    });
  });
});
