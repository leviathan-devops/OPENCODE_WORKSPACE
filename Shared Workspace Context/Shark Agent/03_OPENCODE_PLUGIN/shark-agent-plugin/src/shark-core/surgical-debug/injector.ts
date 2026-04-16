export class DebugInjector {
  injectDebugger(id: string, data: any): Promise<any> {
    return Promise.resolve({ success: false, debugAgentId: id, debugAgentType: 'none' });
  }
}
