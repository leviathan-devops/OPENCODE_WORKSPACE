export const modelLogger = {
  logModelInteraction: (data: any) => {},
  logAsyncOperation: async (name: string, category: string, fn: () => Promise<any>) => {
    return await fn();
  }
};
