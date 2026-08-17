// 新建分析页面 - 8步配置向导
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisStore } from '@/stores/analysisStore';
import { cn } from '@/utils/cn';
import { POPULAR_STOCKS, ANALYST_TYPES, DEPTH_OPTIONS, LLM_PROVIDERS, PROVIDER_MODELS, LANGUAGE_OPTIONS } from '@/utils/constants';
import type { DepthLevel, LLMProvider } from '@/types/analysis';

export default function NewAnalysis() {
  const navigate = useNavigate();
  const { config, updateConfig, currentStep, setCurrentStep } = useAnalysisStore();
  const totalSteps = 8;

  // 股票搜索
  const [stockSearch, setStockSearch] = useState(config.ticker);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // 日期选择
  const [dateType, setDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // 分析师选择
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(config.analysts);

  // 深度选择
  const [selectedDepth, setSelectedDepth] = useState<DepthLevel>(config.depth);

  /** 切换 Provider，自动重置模型选择 */
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(config.provider);

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    const models = PROVIDER_MODELS[provider];
    if (models) {
      setQuickModel(models.quick[0]?.value || '');
      setDeepModel(models.deep[0]?.value || '');
    }
  };
  const [quickModel, setQuickModel] = useState(config.quickModel);
  const [deepModel, setDeepModel] = useState(config.deepModel);

  // 语言
  const [selectedLanguage, setSelectedLanguage] = useState(config.language);

  /** 过滤股票列表 */
  const filteredStocks = stockSearch
    ? POPULAR_STOCKS.filter(
        (s) =>
          s.ticker.toLowerCase().includes(stockSearch.toLowerCase()) ||
          s.name.toLowerCase().includes(stockSearch.toLowerCase())
      )
    : [];

  /** 选择股票 */
  const selectStock = (ticker: string) => {
    setStockSearch(ticker);
    setShowAutocomplete(false);
    updateConfig({ ticker });
  };

  /** 切换分析师 */
  const toggleAnalyst = (id: string) => {
    const next = selectedAnalysts.includes(id)
      ? selectedAnalysts.filter((a) => a !== id)
      : [...selectedAnalysts, id];
    setSelectedAnalysts(next);
    updateConfig({ analysts: next });
  };

  /** 下一步 */
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  /** 上一步 */
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /** 启动分析 */
  const handleStart = () => {
    // 收集所有配置
    const date = dateType === 'today'
      ? new Date().toISOString().split('T')[0]
      : dateType === 'yesterday'
      ? new Date(Date.now() - 86400000).toISOString().split('T')[0]
      : customDate;

    updateConfig({
      ticker: stockSearch,
      date,
      language: selectedLanguage,
      analysts: selectedAnalysts,
      depth: selectedDepth,
      provider: selectedProvider,
      quickModel,
      deepModel,
    });

    navigate('/analysis/live');
  };

  /** 渲染步骤内容 */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>股票代码</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>输入要分析的股票代码</p>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field font-mono"
                placeholder="例如: AAPL, NVDA, TSLA..."
                value={stockSearch}
                onChange={(e) => { setStockSearch(e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                style={{ fontSize: 18, padding: '16px 20px' }}
                autoComplete="off"
              />
              {showAutocomplete && filteredStocks.length > 0 && (
                <div className="autocomplete-list">
                  {filteredStocks.map((s) => (
                    <div key={s.ticker} className="autocomplete-item" onClick={() => selectStock(s.ticker)}>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{s.ticker}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4, lineHeight: '28px' }}>热门:</span>
              {POPULAR_STOCKS.slice(0, 7).map((s) => (
                <button key={s.ticker} className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => selectStock(s.ticker)}>
                  {s.ticker}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>分析日期</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>选择分析的目标日期</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { type: 'today' as const, label: '今天', date: new Date().toISOString().split('T')[0] },
                { type: 'yesterday' as const, label: '昨天', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
              ].map((opt) => (
                <label
                  key={opt.type}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                    borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer',
                    borderColor: dateType === opt.type ? 'var(--accent)' : undefined,
                    background: dateType === opt.type ? 'var(--accent-dim)' : undefined,
                  }}
                  onClick={() => setDateType(opt.type)}
                >
                  <input type="radio" name="analysis-date" checked={dateType === opt.type} style={{ accentColor: 'var(--accent)' }} readOnly />
                  <div>
                    <div style={{ fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }} className="font-mono">{opt.date}</div>
                  </div>
                </label>
              ))}
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                  borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer',
                  borderColor: dateType === 'custom' ? 'var(--accent)' : undefined,
                  background: dateType === 'custom' ? 'var(--accent-dim)' : undefined,
                }}
                onClick={() => setDateType('custom')}
              >
                <input type="radio" name="analysis-date" checked={dateType === 'custom'} style={{ accentColor: 'var(--accent)' }} readOnly />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>自定义日期</div>
                  <input type="date" className="input-field" style={{ marginTop: 8, maxWidth: 220 }} value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>输出语言</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>选择分析报告的输出语言</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <div
                  key={lang.id}
                  className={cn('depth-card', selectedLanguage === lang.id && 'selected')}
                  onClick={() => setSelectedLanguage(lang.id)}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{lang.flag}</div>
                  <div style={{ fontWeight: 600 }}>{lang.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>分析师团队</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>选择参与分析的分析师类型</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {ANALYST_TYPES.map((analyst) => (
                <div
                  key={analyst.id}
                  className={cn('check-card', selectedAnalysts.includes(analyst.id) && 'selected')}
                  onClick={() => toggleAnalyst(analyst.id)}
                >
                  <i className={cn('fas', analyst.icon)} style={{ fontSize: 28, color: analyst.color, marginBottom: 12, display: 'block' }} />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{analyst.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{analyst.description}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>研究深度</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>选择分析的研究深度级别</p>
            <div style={{ display: 'grid', gap: 16 }}>
              {DEPTH_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={cn('depth-card', selectedDepth === option.id && 'selected')}
                  onClick={() => setSelectedDepth(option.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 20 }}
                >
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 14, background: option.bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <i className={cn('fas', option.icon)} style={{ color: option.color, fontSize: 22 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {option.label} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{option.labelCn}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {option.description}预计耗时 {option.duration}。
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>LLM Provider</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>选择大语言模型提供商</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {LLM_PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className={cn('depth-card', selectedProvider === p.id && 'selected')}
                  onClick={() => handleProviderChange(p.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: p.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={cn('fas', p.icon)} style={{ color: p.color }} />
                    </div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.models.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>模型选择</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              为 <span className="font-mono" style={{ color: LLM_PROVIDERS.find((p) => p.id === selectedProvider)?.color }}>{LLM_PROVIDERS.find((p) => p.id === selectedProvider)?.name}</span> 分别选择快速思考和深度思考模型
            </p>
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  <i className="fas fa-bolt" style={{ color: 'var(--warning)' }} /> Quick-thinking Model
                </div>
                <select className="input-field" value={quickModel} onChange={(e) => setQuickModel(e.target.value)}>
                  {(PROVIDER_MODELS[selectedProvider]?.quick || []).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>用于快速数据处理和初步分析</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  <i className="fas fa-brain" style={{ color: 'var(--accent)' }} /> Deep-thinking Model
                </div>
                <select className="input-field" value={deepModel} onChange={(e) => setDeepModel(e.target.value)}>
                  {(PROVIDER_MODELS[selectedProvider]?.deep || []).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>用于复杂推理和最终决策</div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>确认并启动</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>检查配置信息，确认无误后启动分析</p>
            <div style={{ background: 'rgba(148,163,184,0.05)', borderRadius: 12, padding: 20, display: 'grid', gap: 16 }}>
              {[
                { label: '股票代码', value: stockSearch || '-', mono: true },
                { label: '分析日期', value: dateType === 'today' ? new Date().toISOString().split('T')[0] : dateType === 'yesterday' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : customDate, mono: true },
                { label: '输出语言', value: LANGUAGE_OPTIONS.find((l) => l.id === selectedLanguage)?.label || '-', mono: false },
                { label: '分析师团队', value: selectedAnalysts.map((a) => ANALYST_TYPES.find((t) => t.id === a)?.name?.split(' ')[0] || a).join(', '), mono: false },
                { label: '研究深度', value: DEPTH_OPTIONS.find((d) => d.id === selectedDepth)?.label || '-', mono: false },
                { label: 'LLM Provider', value: LLM_PROVIDERS.find((p) => p.id === selectedProvider)?.name || '-', mono: false },
                { label: 'Quick Model', value: quickModel, mono: true },
                { label: 'Deep Model', value: deepModel, mono: true },
              ].map((item, idx) => (
                <div key={item.label}>
                  {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{item.label}</span>
                    <span className={cn(item.mono && 'font-mono')} style={{ fontWeight: item.mono ? 600 : 500, fontSize: item.mono ? undefined : 14 }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>新建分析</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>配置分析参数，启动多 Agent 协作分析</p>
      </div>

      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={cn('step-dot', step < currentStep && 'completed', step === currentStep && 'active')}>
              {step < currentStep ? <i className="fas fa-check" style={{ fontSize: 10 }} /> : step}
            </div>
            {step < totalSteps && (
              <div className={cn('step-line', step < currentStep && 'completed')} />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      <div className="glass-card" style={{ padding: 32, minHeight: 360 }}>
        {renderStepContent()}
      </div>

      {/* 导航按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button
          className={cn('btn-secondary', currentStep === 1 && 'invisible')}
          onClick={handlePrev}
          style={currentStep === 1 ? { visibility: 'hidden' } : undefined}
        >
          <i className="fas fa-arrow-left" /> 上一步
        </button>
        <div style={{ flex: 1 }} />
        {currentStep === totalSteps ? (
          <button className="btn-primary" onClick={handleStart} aria-label="启动分析">
            <i className="fas fa-rocket" /> 启动分析
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext}>
            下一步 <i className="fas fa-arrow-right" />
          </button>
        )}
      </div>
    </div>
  );
}
