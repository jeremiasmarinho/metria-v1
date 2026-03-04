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

/** Eventos de intenção e conversão para CPL/Diagnóstico (Modelo Oto) */
export interface TrackingPreferences {
  ga4IntentEvents?: string[];
  ga4ConversionEvents?: string[];
  metaConversionEvents?: string[];
}

export interface ReportConfig {
  logo?: string;
  primaryColor?: string;
  sections?: string[];
  trackingPreferences?: TrackingPreferences;
}
