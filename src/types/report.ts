export type ReportStatus =
  | "PENDING"
  | "INGESTING"
  | "PROCESSING"
  | "ANALYZING"
  | "COMPILING"
  | "STORING"
  | "DELIVERING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIAL";

/**
 * Saída estruturada da análise IA (Modelo Oto).
 * Gerada numa única chamada com response_format: json_object.
 */
export interface AIAnalysisOutput {
  clientReport: {
    /** Explicação de eficiência, discrepância Meta vs GA4, impacto na decisão */
    resumoExecutivo: string;
  };
  internalReport: {
    diagnosticoGeral: string;
    canalMaisEficiente: string;
    /** Focado em alto tráfego com baixa conversão */
    gargaloPrincipal: string;
    /** Exatamente 2 ações */
    acoesRecomendadas: string[];
  };
}
