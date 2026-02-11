'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  RefreshCw, Download, Search, Sun, Moon, Package, Hash,
  Building2, AlertCircle, Phone, ChevronDown, Loader2,
  CheckCircle2, XCircle, Clock, TrendingUp
} from 'lucide-react';
import { fetchSheetData, processDashboardData } from '@/lib/fetchSheetData';
import { CITIES, TOTAL_ORGS, MASTER_ORGS } from '@/lib/masterData';
import type { DashboardData, Organization, SurveyResponse } from '@/lib/masterData';

const REFRESH_INTERVAL = 60_000; // 60초

const CHART_COLORS = [
  '#2563EB', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#F97316',
  '#84CC16', '#0EA5E9', '#D946EF', '#22D3EE', '#A855F7',
  '#FB923C', '#4ADE80', '#38BDF8',
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [cityFilter, setCityFilter] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'submitted' | 'unsubmitted'>('submitted');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [remarkModal, setRemarkModal] = useState<{ orgName: string; text: string } | null>(null);

  const toggleCity = useCallback((city: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city); else next.add(city);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedCities(new Set(CITIES));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedCities(new Set());
  }, []);

  // 데이터 로드
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const responses = await fetchSheetData();
      const processed = processDashboardData(responses);
      setData(processed);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 초기 로드 (자동 폴링 제거: 사용자가 수동 새로고침 사용)
  useEffect(() => {
    loadData();
    // const interval = setInterval(() => loadData(true), REFRESH_INTERVAL);
    // return () => clearInterval(interval);
  }, [loadData]);

  // 다크모드 토글
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 필터링된 응답 데이터
  const filteredResponses = useMemo(() => {
    if (!data) return [];
    let filtered = data.responses;

    if (cityFilter !== '전체') {
      filtered = filtered.filter(r => r.city === cityFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.orgName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [data, cityFilter, searchQuery]);

  // 필터링된 미제출 기관
  const filteredUnsubmitted = useMemo(() => {
    if (!data) return [];
    let list = data.unsubmittedOrgs;

    if (cityFilter !== '전체') {
      list = list.filter(o => o.city === cityFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, cityFilter, searchQuery]);

  // CSV 익스포트
  const exportCSV = useCallback(() => {
    if (!data) return;

    if (activeTab === 'submitted') {
      const headers = '제출시간,시군,기관명,수령 박스 수,내용물 수량,특이사항\n';
      const rows = filteredResponses.map(r =>
        `"${r.timestamp}","${r.city}","${r.orgName}",${r.boxes},${r.quantity},"${r.remarks}"`
      ).join('\n');

      downloadCSV(headers + rows, '제출기관_현황.csv');
    } else {
      const headers = '시군,기관코드,기관명,전화번호\n';
      const rows = filteredUnsubmitted.map(o =>
        `"${o.city}","${o.code}","${o.name}","${o.phone}"`
      ).join('\n');

      downloadCSV(headers + rows, '미제출기관_명단.csv');
    }
  }, [data, activeTab, filteredResponses, filteredUnsubmitted]);

  function downloadCSV(content: string, filename: string) {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 로딩 스크린
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-blue-200 dark:border-blue-900 mx-auto"></div>
            <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-blue-600 animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300"
        style={{
          backgroundColor: darkMode ? 'rgba(11, 17, 32, 0.85)' : 'rgba(248, 250, 252, 0.85)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  희망열기 캠페인
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  물품 배분 현황 대시보드
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Last Updated */}
              {lastUpdated && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">새로고침</span>
              </button>

              {/* Dark/Light Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert Card */}
        {data && data.responses.some(r => r.boxes > 0 && r.quantity === 0) && (
          <div className="p-1 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg animate-pulse-slow">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-500">수량 입력 오류 감지</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    박스 수량은 입력되었으나 내용물 수량이 0인 데이터가 <span className="font-bold text-red-500">{data.responses.filter(r => r.boxes > 0 && r.quantity === 0).length}건</span> 있습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const errorRow = document.querySelector('.border-l-4.border-red-500');
                  errorRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                확인하기
              </button>
            </div>
          </div>
        )}
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 제출율 */}
          <KPICard
            icon={<TrendingUp className="w-5 h-5" />}
            label="제출율"
            value={`${data.submissionRate}%`}
            sub={`${data.submittedCount} / ${data.totalOrgs}개소`}
            color="#2563EB"
            delay={0}
          >
            <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-full rounded-full progress-bar-fill"
                style={{
                  width: `${data.submissionRate}%`,
                  background: 'linear-gradient(90deg, #2563EB, #06B6D4)',
                }}
              />
            </div>
          </KPICard>

          {/* 누적 박스 */}
          <KPICard
            icon={<Package className="w-5 h-5" />}
            label="누적 박스"
            value={data.totalBoxes.toLocaleString()}
            sub="수령 박스 합계"
            color="#06B6D4"
            delay={1}
          />

          {/* 누적 수량 */}
          <KPICard
            icon={<Hash className="w-5 h-5" />}
            label="누적 수량"
            value={data.totalQuantity.toLocaleString()}
            sub="내용물 총 수량"
            color="#10B981"
            delay={2}
          />

          {/* 미제출 기관 */}
          <KPICard
            icon={<Building2 className="w-5 h-5" />}
            label="미제출 기관"
            value={`${data.unsubmittedOrgs.length}개소`}
            sub="독려 필요"
            color="#EF4444"
            delay={3}
          />
        </div>

        {/* ── 시·군별 배분 현황 차트 ── */}
        <div
          className="rounded-2xl p-6 animate-fade-in-up"
          style={{
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-color)',
            animationDelay: '0.3s',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                시·군별 제출 현황
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                지역별 기관 제출 완료 현황 (전체 대비 제출)
              </p>
            </div>
          </div>

          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.cityStats.map(s => ({ ...s, unsubmitted: s.total - s.submitted }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? '#334155' : '#E2E8F0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="city"
                  tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#475569' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickLine={false}
                  axisLine={{ stroke: darkMode ? '#334155' : '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: darkMode ? '#94A3B8' : '#475569' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    color: darkMode ? '#F1F5F9' : '#0F172A',
                    fontSize: '13px',
                  }}
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    const label = name === 'submitted' ? '제출' : name === 'unsubmitted' ? '미제출' : name;
                    return [`${value}개소`, label];
                  }}
                  cursor={{ fill: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)' }}
                />
                <Bar dataKey="submitted" name="submitted" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} maxBarSize={40} />
                <Bar dataKey="unsubmitted" name="unsubmitted" stackId="a" fill={darkMode ? '#475569' : '#E2E8F0'} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 시·군별 상세 현황 ── */}
        {data && (
          <div
            className="rounded-2xl p-6 animate-fade-in-up"
            style={{
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-color)',
              animationDelay: '0.35s',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  시·군별 상세 현황
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  각 시·군의 제출 / 미제출 기관을 확인하세요
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  전체 펼치기
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  전체 접기
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CITIES.map(city => {
                const cityOrgs = MASTER_ORGS.filter(o => o.city === city);
                const submittedNames = new Set(data.responses.map(r => r.orgName.trim()));
                const submitted = cityOrgs.filter(o => submittedNames.has(o.name));
                const unsubmitted = cityOrgs.filter(o => !submittedNames.has(o.name));
                const isExpanded = expandedCities.has(city);
                const allDone = unsubmitted.length === 0;

                return (
                  <div
                    key={city}
                    className="rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      border: `1px solid ${allDone ? '#10B98140' : 'var(--border-color)'}`,
                      backgroundColor: allDone ? (darkMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)') : 'var(--bg-primary)',
                    }}
                  >
                    <button
                      onClick={() => toggleCity(city)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{city}</span>
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: allDone ? '#10B98120' : '#2563EB15',
                            color: allDone ? '#10B981' : '#2563EB',
                          }}
                        >
                          {submitted.length}/{cityOrgs.length}
                        </span>
                        {allDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-1">
                        {submitted.map(o => (
                          <div key={o.code} className="flex items-center gap-2 text-xs py-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span style={{ color: 'var(--text-primary)' }}>{o.name}</span>
                          </div>
                        ))}
                        {unsubmitted.map(o => (
                          <div key={o.code} className="flex items-center gap-2 text-xs py-1">
                            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {o.name}
                              {o.manager && <span className="text-[10px] ml-1 opacity-75">({o.manager})</span>}
                            </span>
                            <a href={`tel:${o.phone.replace(/-/g, '')}`} className="ml-auto flex-shrink-0" title={`${o.phone} 전화 걸기`}>
                              <Phone className="w-3 h-3 text-blue-500 hover:text-blue-600" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters & Search Bar ── */}
        <div
          className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* City Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-w-[140px] justify-between transition-all"
              style={{
                backgroundColor: cityFilter !== '전체' ? '#2563EB' : 'var(--bg-primary)',
                color: cityFilter !== '전체' ? '#FFFFFF' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span>{cityFilter}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCityDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowCityDropdown(false)} />
                <div
                  className="absolute top-full left-0 mt-1 rounded-xl shadow-xl z-40 min-w-[160px]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => { setCityFilter('전체'); setShowCityDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    전체
                  </button>
                  {CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => { setCityFilter(city); setShowCityDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      style={{
                        color: 'var(--text-primary)',
                        backgroundColor: cityFilter === city ? (darkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)') : 'transparent',
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="기관명, 지역 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>

          {/* Tab Toggle */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <button
              onClick={() => setActiveTab('submitted')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'submitted' ? '#2563EB' : 'transparent',
                color: activeTab === 'submitted' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>제출 ({data.submittedCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('unsubmitted')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'unsubmitted' ? '#EF4444' : 'transparent',
                color: activeTab === 'unsubmitted' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              <XCircle className="w-4 h-4" />
              <span>미제출 ({data.unsubmittedOrgs.length})</span>
            </button>
          </div>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
            }}
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>

        {/* ── Data Table ── */}
        <div
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-color)',
            animationDelay: '0.4s',
          }}
        >
          {activeTab === 'submitted' ? (
            <SubmittedTable responses={filteredResponses} onRemarkClick={(orgName, text) => setRemarkModal({ orgName, text })} />
          ) : (
            <UnsubmittedTable orgs={filteredUnsubmitted} />
          )}
        </div>

        {/* ── 자동 갱신 안내 Footer ── */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            데이터는 60초마다 자동으로 갱신됩니다 · 경상남도 노인맞춤돌봄서비스 광역지원기관 (v1.1)
          </p>
        </div>
      </main>

      {/* ── Refreshing Indicator ── */}
      {refreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            color: '#FFFFFF',
          }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">갱신 중...</span>
        </div>
      )}

      {/* ── Remark Modal ── */}
      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRemarkModal(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>기타 특이사항</h3>
            </div>
            <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--text-muted)' }}>{remarkModal.orgName}</p>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              {remarkModal.text}
            </div>
            <button
              onClick={() => setRemarkModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KPI Card Component ── */
function KPICard({
  icon,
  label,
  value,
  sub,
  color,
  delay,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 animate-fade-in-up transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-color)',
        animationDelay: `${delay * 0.1}s`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-extrabold animate-count-up" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
      {children}
    </div>
  );
}

/* ── Submitted Table ── */
/* ── Submitted Table ── */
function SubmittedTable({ responses, onRemarkClick }: { responses: SurveyResponse[]; onRemarkClick: (orgName: string, text: string) => void }) {
  // 기관명 정규화 함수 (공백, 특수문자 제거)
  const normalizeKey = useCallback((name: string) => {
    return name.normalize('NFC').replace(/[^가-힣a-zA-Z0-9]/g, '');
  }, []);

  // 기관명으로 전화번호 조회
  const phoneMap = useMemo(() => {
    const map = new Map<string, string>();
    MASTER_ORGS.forEach(org => {
      map.set(normalizeKey(org.name), org.phone);
    });
    return map;
  }, [normalizeKey]);

  if (responses.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          제출된 데이터가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              #
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              시·군
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              기관명
            </th>
            <th className="text-right px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              박스
            </th>
            <th className="text-right px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              수량
            </th>
            <th className="text-center px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              비고
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              담당자
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              연락처
            </th>
            <th className="text-center px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              전화
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              제출시간
            </th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r, i) => {
            // Strict normalization key lookup
            const searchKey = normalizeKey(r.orgName);
            const phone = phoneMap.get(searchKey);
            const isQuantityError = r.boxes > 0 && r.quantity === 0;

            return (
              <tr
                key={i}
                className={`table-row-hover transition-colors duration-200 ${isQuantityError ? 'bg-red-500/10 hover:bg-red-500/20' : ''}`}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  ...(isQuantityError ? { borderLeft: '4px solid #EF4444' } : {})
                }}
              >
                <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {i + 1}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: isQuantityError ? '#EF444420' : '#2563EB15',
                      color: isQuantityError ? '#EF4444' : '#2563EB',
                    }}
                  >
                    {r.city}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {r.orgName}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {r.boxes.toLocaleString()}
                </td>
                <td
                  // isQuantityError일 때 스타일 직접 적용
                  className="px-5 py-3.5 text-right font-semibold"
                  style={{
                    color: isQuantityError ? '#EF4444' : 'var(--text-primary)',
                    fontWeight: isQuantityError ? '800' : '600'
                  }}
                >
                  {r.quantity.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {r.remarks ? (
                    <div className="group relative inline-flex">
                      <button
                        onClick={() => onRemarkClick(r.orgName, r.remarks)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:scale-105"
                        style={{ backgroundColor: '#F59E0B15', color: '#F59E0B' }}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>보기</span>
                      </button>
                      {/* Hover Preview Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left leading-relaxed"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <div className="text-xs font-medium mb-1 text-amber-500">미리보기</div>
                        <div className="text-xs line-clamp-3">{r.remarks}</div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {r.managerName || '—'}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {phone || '—'}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/-/g, '')}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: '#10B98115',
                        color: '#10B981',
                      }}
                      title={`${r.orgName} 전화 걸기`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {r.timestamp ? formatTimestamp(r.timestamp) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Unsubmitted Table ── */
function UnsubmittedTable({ orgs }: { orgs: Organization[] }) {
  if (orgs.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          모든 기관이 제출을 완료했습니다! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              #
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              시·군
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              기관코드
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              기관명
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              담당자
            </th>
            <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              연락처
            </th>
            <th className="text-center px-5 py-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              전화
            </th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o, i) => (
            <tr
              key={o.code}
              className="table-row-hover"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: '#EF444415',
                    color: '#EF4444',
                  }}
                >
                  {o.city}
                </span>
              </td>
              <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {o.code}
              </td>
              <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                {o.name}
              </td>
              <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                {o.manager || '—'}
              </td>
              <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>
                {o.phone}
              </td>
              <td className="px-5 py-3.5 text-center">
                <a
                  href={`tel:${o.phone.replace(/-/g, '')}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: '#10B98115',
                    color: '#10B981',
                  }}
                  title={`${o.name} 전화 걸기`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Utility ── */
function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}
