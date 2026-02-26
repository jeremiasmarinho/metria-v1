export interface ClientIntegrations {
  google?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  meta?: {
    accessToken: string;
    expiresAt: number;
  };
}

export interface ReportConfig {
  logo?: string;
  primaryColor?: string;
  sections?: string[];
}
