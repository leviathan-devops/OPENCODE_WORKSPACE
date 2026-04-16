export interface SafetyCheck {
  blocked: boolean;
  reason?: string;
  warnings?: string[];
}

export interface FirewallStats {
  totalChecks: number;
  blocked: number;
  warnings: number;
  allowed: number;
}

export interface StagnationStats {
  totalFailures: number;
  uniqueTools: number;
  recentAlerts: any[];
}

export interface SafetyAdapter {
  checkOperation(operation: string, data: any): Promise<SafetyCheck>;
  getStats(): { firewall: FirewallStats; stagnation: StagnationStats };
}
