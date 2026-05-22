'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  UsersThreeIcon,
  TrendUpIcon,
  LightbulbIcon,
  UserFocusIcon,
  UserIcon,
} from '@phosphor-icons/react/ssr';
import type { PCEStats } from '@/lib/pce-sheets';
import type { PCEParticipant } from '@/lib/pce-participants';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/dashboard-utils';
import { Panel } from '@/app/components/Panel';
import { RadarKpiCard } from './RadarKpiCard';
import { PieLabelChart } from './PieLabelChart';
import { ReBarChart } from './ReBarChart';
import { ReColumnChart } from './ReColumnChart';
import { ParticipantsTable } from './ParticipantsTable';

type Tab = 'visao-geral' | 'desafios' | 'participantes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'desafios', label: 'Desafios & Canais' },
  { id: 'participantes', label: 'Participantes' },
];

// Paletas por categoria
const FASE_COLORS = ['#7c5cbf', '#2dd4bf', '#f59e0b', '#94a3b8', '#10b981'];
const EQUIPE_COLORS = ['#7c5cbf', '#10b981', '#f59e0b', '#f43f5e', '#2dd4bf'];
const DEP_COLORS = ['#f43f5e', '#f59e0b', '#10b981'];
const DESAFIO_COLORS = [
  '#f43f5e',
  '#7c5cbf',
  '#f59e0b',
  '#e2d5b0',
  '#10b981',
  '#60a5fa',
];
const CLAREZA_COLORS = [
  '#f43f5e',
  '#f43f5e',
  '#f59e0b',
  '#f59e0b',
  '#e2d5b0',
  '#10b981',
];

type Props = { data: PCEStats; participants: PCEParticipant[] };

export const PCEDashboard = ({ data, participants }: Props) => {
  const [tab, setTab] = useState<Tab>('visao-geral');

  const total = data.totalRespondentes;
  const dispostosPct = Math.round((data.dispostosMudar / total) * 100);
  const dependPct = Math.round((data.dependenciaTotal / total) * 100);
  const solosCount =
    data.equipe.find((e) => e.label.toLowerCase().includes('sozinho'))?.count ??
    0;
  const solosPct = Math.round((solosCount / total) * 100);

  return (
    <section className="relative min-h-screen overflow-hidden bg-brand-dark-blue px-6 py-8 text-white md:px-10 md:py-10">
      {/* Backgrounds */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden scale-110 bg-cover bg-center md:block"
        style={{ backgroundImage: 'url(/images/desktop.JPG)' }}
      >
        <div className="absolute inset-0 bg-brand-dark-blue/30 backdrop-blur-sm" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 block scale-110 bg-cover bg-center md:hidden"
        style={{ backgroundImage: 'url(/images/mobile.JPG)' }}
      >
        <div className="absolute inset-0 bg-brand-dark-blue/30 backdrop-blur-sm" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/sdw-logo-gold.png"
              alt="PCE"
              width={56}
              height={56}
              priority
              className="h-12 w-auto"
            />
            <div>
              <span className="block text-[10px] font-black tracking-[0.3em] text-brand-cream uppercase">
                — Diagnóstico Inicial
              </span>
              <h1 className="font-display text-2xl font-black tracking-tighter uppercase md:text-3xl">
                Programa de Crescimento Empresarial
              </h1>
              <p className="text-[10px] font-bold tracking-wide text-white/40">
                {total} participantes · Abril 2026
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div
          role="tablist"
          className="mb-6 flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative rounded-full px-5 py-2 text-[10px] font-black tracking-[0.18em] uppercase transition-colors',
                  active
                    ? 'text-brand-dark-blue'
                    : 'text-white/60 hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="pce-tab-pill"
                    className="absolute inset-0 rounded-full bg-brand-cream"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── TAB: VISÃO GERAL ─────────────────────────────────── */}
          {tab === 'visao-geral' && (
            <motion.div
              key="visao-geral"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              {/* KPI Row */}
              <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <RadarKpiCard
                  label="Total Participantes"
                  value={total}
                  subValue="respostas válidas"
                  icon={<UsersThreeIcon size={16} weight="bold" />}
                  color="#7c5cbf"
                  iconClass="bg-brand-purple"
                  delay={0}
                />
                <RadarKpiCard
                  label="Clareza Média"
                  value={`${data.clarezaMedia}/5`}
                  subValue="sobre crescimento"
                  icon={<LightbulbIcon size={16} weight="bold" />}
                  color="#e2d5b0"
                  iconClass="bg-brand-cream text-brand-dark-blue"
                  progress={Math.round((data.clarezaMedia / 5) * 100)}
                  delay={0.05}
                />
                <RadarKpiCard
                  label="Trabalham Sozinhos"
                  value={solosCount}
                  subValue={`${solosPct}% do total`}
                  icon={<UserIcon size={16} weight="bold" />}
                  color="#f59e0b"
                  iconClass="bg-amber-500"
                  progress={solosPct}
                  delay={0.1}
                />
                <RadarKpiCard
                  label="Dependem do Dono"
                  value={data.dependenciaTotal}
                  subValue={`${dependPct}% totalmente`}
                  icon={<UserFocusIcon size={16} weight="bold" />}
                  color="#f43f5e"
                  iconClass="bg-rose-500"
                  progress={dependPct}
                  delay={0.15}
                />
              </div>

              {/* Row 1: Fase (donut) + Faturamento (h-bar) */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Fase da Empresa"
                  subtitle={`${total} respondentes`}
                  delay={0.2}
                >
                  <PieLabelChart
                    data={data.faseEmpresa}
                    total={total}
                    colors={FASE_COLORS}
                  />
                </Panel>
                <Panel
                  title="Faturamento Mensal"
                  subtitle="distribuição por faixa de receita"
                  delay={0.25}
                >
                  <ReBarChart
                    data={data.faturamento}
                    total={total}
                    color="#e2d5b0"
                    labelTruncate={22}
                  />
                </Panel>
              </div>

              {/* Row 2: Clareza (column) + Equipe (donut) */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Nível de Clareza (0 a 5)"
                  subtitle="sobre como crescer sua empresa"
                  delay={0.3}
                >
                  <ReColumnChart
                    data={data.clareza}
                    colors={CLAREZA_COLORS}
                    height={200}
                  />
                </Panel>
                <Panel
                  title="Tamanho da Equipe"
                  subtitle="pessoas na operação"
                  delay={0.35}
                >
                  <PieLabelChart
                    data={data.equipe}
                    total={total}
                    colors={EQUIPE_COLORS}
                  />
                </Panel>
              </div>

              {/* Row 3: Investimento (h-bar) + Satisfação (column) */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Investimento em Crescimento"
                  subtitle="frequência de investimento no negócio"
                  delay={0.4}
                >
                  <ReBarChart
                    data={data.investimento}
                    total={total}
                    color="#f59e0b"
                    labelTruncate={28}
                  />
                </Panel>
                <Panel
                  title="Satisfação com Ambiência"
                  subtitle="escala 1–5 · ambiente / mesa atual"
                  delay={0.45}
                >
                  <ReColumnChart
                    data={data.satisfacaoAmbiente}
                    colors={[
                      '#f43f5e',
                      '#f59e0b',
                      '#f59e0b',
                      '#e2d5b0',
                      '#10b981',
                    ]}
                    height={200}
                  />
                </Panel>
              </div>

              {/* Row 4: Cidades + Faixa Etária */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Cidades"
                  subtitle="top cidades · onde moram os respondentes"
                  delay={0.5}
                >
                  <ReBarChart
                    data={data.cidades}
                    total={total}
                    color="#7c5cbf"
                    labelTruncate={20}
                  />
                </Panel>
                <Panel
                  title="Faixa Etária"
                  subtitle="distribuição por idade"
                  delay={0.55}
                >
                  <ReBarChart
                    data={data.faixaEtaria}
                    total={total}
                    color="#2dd4bf"
                    labelTruncate={22}
                  />
                </Panel>
              </div>
            </motion.div>
          )}

          {/* ── TAB: DESAFIOS & CANAIS ───────────────────────────── */}
          {tab === 'desafios' && (
            <motion.div
              key="desafios"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              {/* KPI Row contextual */}
              <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <RadarKpiCard
                  label="Dispostos a Mudar"
                  value={`${dispostosPct}%`}
                  subValue={`${data.dispostosMudar} respondentes`}
                  icon={<TrendUpIcon size={16} weight="bold" />}
                  color="#10b981"
                  iconClass="bg-emerald-500"
                  progress={dispostosPct}
                  delay={0}
                />
                <RadarKpiCard
                  label="Dependem do Dono"
                  value={`${dependPct}%`}
                  subValue={`${data.dependenciaTotal} respondentes`}
                  icon={<UserFocusIcon size={16} weight="bold" />}
                  color="#f43f5e"
                  iconClass="bg-rose-500"
                  progress={dependPct}
                  delay={0.05}
                />
                <RadarKpiCard
                  label="Principal Desafio"
                  value="Vendas"
                  subValue={`${data.desafios[0]?.count ?? 0} menções`}
                  icon={<LightbulbIcon size={16} weight="bold" />}
                  color="#7c5cbf"
                  iconClass="bg-brand-purple"
                  delay={0.1}
                />
                <RadarKpiCard
                  label="Canal Dominante"
                  value="Indicação"
                  subValue={`${data.canaisVenda[0]?.count ?? 0} respondentes`}
                  icon={<UsersThreeIcon size={16} weight="bold" />}
                  color="#14b8a6"
                  iconClass="bg-teal-500"
                  delay={0.15}
                />
              </div>

              {/* Maiores Desafios — column chart full width */}
              <div className="mb-4">
                <Panel
                  title="Maiores Desafios (Top Menções)"
                  subtitle="múltipla escolha · até 3 por resposta"
                  delay={0.2}
                >
                  <ReColumnChart
                    data={data.desafios.map((d) => ({
                      label: d.label.split('(')[0].trim(),
                      count: d.count,
                    }))}
                    colors={DESAFIO_COLORS}
                    height={220}
                  />
                </Panel>
              </div>

              {/* Canais (h-bar) + Dependência (donut) */}
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Canais de Venda"
                  subtitle="múltipla escolha · como acontecem as vendas"
                  delay={0.3}
                >
                  <ReBarChart
                    data={data.canaisVenda}
                    total={total}
                    color="#10b981"
                    labelTruncate={20}
                  />
                </Panel>
                <Panel
                  title="Dependência do Dono"
                  subtitle="negócio depende de você para vender?"
                  delay={0.35}
                >
                  <PieLabelChart
                    data={data.dependencia}
                    total={total}
                    colors={DEP_COLORS}
                  />
                </Panel>
              </div>

              {/* Segmentos */}
              <div className="mb-4">
                <Panel
                  title="Segmentos / Área de Atuação"
                  subtitle="top 12 · principais mercados representados"
                  delay={0.4}
                >
                  <ReBarChart
                    data={data.segmentos}
                    total={total}
                    color="#60a5fa"
                    maxItems={12}
                    labelTruncate={36}
                  />
                </Panel>
              </div>
            </motion.div>
          )}

          {/* ── TAB: PARTICIPANTES ───────────────────────────────── */}
          {tab === 'participantes' && (
            <motion.div
              key="participantes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              <Panel
                title="Todos os Participantes"
                subtitle={`${participants.length} respondentes · busca por nome, empresa, segmento ou cidade`}
                delay={0}
              >
                <ParticipantsTable participants={participants} />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-6 flex flex-col items-center justify-between gap-2 text-[10px] font-black tracking-[0.3em] text-white/30 uppercase sm:flex-row">
          <span>Total: {total} respondentes</span>
          <span>Diagnóstico PCE · Dados estáticos</span>
          <span>
            Período: <span className="text-brand-cream">06 a 14 abr 2026</span>
          </span>
        </footer>
      </div>
    </section>
  );
};
