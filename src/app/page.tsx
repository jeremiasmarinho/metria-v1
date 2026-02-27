import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070B14] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[460px] w-[460px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_35%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <span className="animate-in fade-in slide-in-from-bottom-4 mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm duration-700">
          METRIA for Agencies
        </span>

        <h1 className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-white duration-700 sm:text-5xl lg:text-6xl">
          Inteligencia de Marketing para Clinicas de Alto Padrao
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-4 mt-6 max-w-2xl text-balance text-base text-slate-300 duration-700 sm:text-lg">
          Automatize a coleta de Google e Meta Ads, gere analises com IA e entregue relatorios executivos em PDF com consistencia operacional.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-4 mt-10 duration-700">
          <Link href="/login">
            <Button className="group h-12 rounded-2xl border border-white/20 bg-white/10 px-7 text-base text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20">
              Acessar Painel
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 gap-4 duration-700 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 text-left shadow-sm backdrop-blur-sm">
            <Link2 className="mb-3 h-5 w-5 text-cyan-300" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Integracao Oficial Meta & Google</h3>
            <p className="mt-2 text-sm text-slate-300">
              Conecte suas fontes de dados de marketing em um unico fluxo operacional.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 text-left shadow-sm backdrop-blur-sm">
            <FileText className="mb-3 h-5 w-5 text-indigo-300" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Geracao de PDFs em Segundos</h3>
            <p className="mt-2 text-sm text-slate-300">
              Transforme dados em relatorios executivos prontos para envio em escala.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 text-left shadow-sm backdrop-blur-sm">
            <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Arquitetura Segura</h3>
            <p className="mt-2 text-sm text-slate-300">
              Pipeline resiliente com isolamento de credenciais e entrega confiavel multicanal.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

