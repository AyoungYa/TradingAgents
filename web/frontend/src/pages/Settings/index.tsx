// 系统设置页面
import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { LLM_PROVIDERS } from '@/utils/constants';

/** API Key 输入框组件 */
function ApiKeyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={visible ? 'text' : 'password'}
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="未设置"
          style={{ flex: 1 }}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '8px 16px' }}
          onClick={() => setVisible(!visible)}
          aria-label={visible ? '隐藏 API Key' : '显示 API Key'}
        >
          <i className={visible ? 'fas fa-eye-slash' : 'fas fa-eye'} />
        </button>
      </div>
    </div>
  );
}

/** Toggle 开关组件 */
function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <button
        type="button"
        className={`toggle-switch ${value ? 'active' : ''}`}
        role="switch"
        aria-checked={value}
        aria-label={`启用${label}`}
        onClick={() => onChange(!value)}
      />
    </div>
  );
}

export default function Settings() {
  const { settings, updateLLMProvider, updateDefaultModels, updateDataSource, updateNotification, updatePreference, resetToDefault } = useSettingsStore();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>系统设置</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>配置 LLM Provider、数据源和用户偏好</p>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 800 }}>
        {/* LLM Provider 配置 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <i className="fas fa-brain" style={{ color: 'var(--accent)', fontSize: 18 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>LLM Provider 配置</h2>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {LLM_PROVIDERS.map((p) => (
              <ApiKeyInput
                key={p.id}
                label={`${p.name} API Key`}
                value={settings.llmProviders[p.id as keyof typeof settings.llmProviders]}
                onChange={(v) => updateLLMProvider(p.id, v)}
              />
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认 Quick-thinking 模型</label>
                <select
                  className="input-field"
                  value={settings.defaultModels.quickModel}
                  onChange={(e) => updateDefaultModels(e.target.value, settings.defaultModels.deepModel)}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="claude-haiku-3.5">claude-haiku-3.5</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认 Deep-thinking 模型</label>
                <select
                  className="input-field"
                  value={settings.defaultModels.deepModel}
                  onChange={(e) => updateDefaultModels(settings.defaultModels.quickModel, e.target.value)}
                >
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="claude-sonnet-4">claude-sonnet-4</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  <option value="deepseek-r1">deepseek-r1</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 数据源配置 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <i className="fas fa-database" style={{ color: '#818cf8', fontSize: 18 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>数据源配置</h2>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Yahoo Finance (yfinance)</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>免费股票数据，延迟 15 分钟</div>
              </div>
              <Toggle label="" description="" value={settings.dataSources.yahooFinance} onChange={(v) => updateDataSource('yahooFinance', v)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Alpha Vantage</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>高级金融数据 API，实时行情</div>
              </div>
              <Toggle label="" description="" value={settings.dataSources.alphaVantage} onChange={(v) => updateDataSource('alphaVantage', v)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Alpha Vantage API Key (可选)</label>
              <input
                type="password"
                className="input-field"
                placeholder="输入 API Key..."
                value={settings.dataSources.alphaVantageKey}
                onChange={(e) => updateDataSource('alphaVantageKey', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <i className="fas fa-bell" style={{ color: 'var(--warning)', fontSize: 18 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>通知设置</h2>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <Toggle
              label="分析完成通知"
              description="分析完成时发送桌面通知"
              value={settings.notifications.analysisComplete}
              onChange={(v) => updateNotification('analysisComplete', v)}
            />
            <Toggle
              label="声音提醒"
              description="分析完成时播放提示音"
              value={settings.notifications.soundAlert}
              onChange={(v) => updateNotification('soundAlert', v)}
            />
            <Toggle
              label="邮件通知"
              description="将报告摘要发送至邮箱"
              value={settings.notifications.emailNotify}
              onChange={(v) => updateNotification('emailNotify', v)}
            />
          </div>
        </div>

        {/* 用户偏好 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <i className="fas fa-sliders-h" style={{ color: '#ec4899', fontSize: 18 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>用户偏好</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认分析师团队</label>
              <select className="input-field" value={settings.preferences.defaultAnalysts} onChange={(e) => updatePreference('defaultAnalysts', e.target.value)}>
                <option value="all">全部 (Market + Social + News + Fundamentals)</option>
                <option value="tech">仅技术分析 (Market)</option>
                <option value="fundamental">基本面分析 (Market + Fundamentals)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认研究深度</label>
              <select className="input-field" value={settings.preferences.defaultDepth} onChange={(e) => updatePreference('defaultDepth', e.target.value)}>
                <option value="medium">Medium (标准分析)</option>
                <option value="shallow">Shallow (快速扫描)</option>
                <option value="deep">Deep (深度研究)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认输出语言</label>
              <select className="input-field" value={settings.preferences.defaultLanguage} onChange={(e) => updatePreference('defaultLanguage', e.target.value)}>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>默认 LLM Provider</label>
              <select className="input-field" value={settings.preferences.defaultProvider} onChange={(e) => updatePreference('defaultProvider', e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="anthropic">Anthropic</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
          <button className="btn-secondary" onClick={resetToDefault}>重置默认</button>
          <button className="btn-primary"><i className="fas fa-save" /> 保存设置</button>
        </div>
      </div>
    </div>
  );
}
