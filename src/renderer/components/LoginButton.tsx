import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { authService } from '../services/auth';
import { i18nService } from '../services/i18n';
import { RootState } from '../store';
import { setLoggedIn } from '../store/slices/authSlice';
import type { CreditItem, UserProfile } from '../store/slices/authSlice';
import UserAvatarIcon from './icons/UserAvatarIcon';

const getSubscriptionBadge = (label: string) => {
  // Determine badge style based on label
  const isStandard = /标准|Standard/i.test(label);
  const isAdvanced = /进阶|Advanced/i.test(label);
  const isPro = /专业|Pro/i.test(label);

  if (isPro) {
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      text: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
          <path d="M2 4l3 12h14l3-12-5 4-5-6-5 6z" /><path d="M5 16l-1.5 4h17L19 16" />
        </svg>
      ),
    };
  }
  if (isAdvanced) {
    return {
      bg: 'bg-gradient-to-r from-purple-500 to-violet-400',
      text: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    };
  }
  if (isStandard) {
    return {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      text: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    };
  }

  return null;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  // Format "2026-03-29" to "26.03.29"
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
};

const formatCredits = (n: number): string => {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
};

const CreditItemRow: React.FC<{ item: CreditItem; isEn: boolean }> = ({ item, isEn }) => {
  const label = isEn ? item.labelEn : item.label;
  const badge = item.type === 'subscription' ? getSubscriptionBadge(label) : null;
  const expiresText = item.expiresAt
    ? `${i18nService.t('authExpiresAt')}${formatDate(item.expiresAt)}`
    : '';

  return (
    <div className="flex flex-col gap-0.5 py-1.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-1.5">
        {badge ? (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text}`}>
            {badge.icon}
            {label}
          </span>
        ) : (
          <span className="text-xs text-secondary">
            {label}
          </span>
        )}
        <span className="text-xs font-medium text-foreground">
          {formatCredits(item.creditsRemaining)}{i18nService.t('authCreditsUnit')}
        </span>
      </div>
      {expiresText && (
        <span className="text-[10px] text-secondary pl-0.5">
          {expiresText}
        </span>
      )}
    </div>
  );
};

const UserMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const profileSummary = useSelector((state: RootState) => state.auth.profileSummary);
  const [creditsExpanded, setCreditsExpanded] = useState(false);
  const isEn = i18nService.getLanguage() === 'en';

  useEffect(() => {
    authService.fetchProfileSummary();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    onClose();
  };

  const handleSubscribe = async () => {
    const { getPortalPricingUrl } = await import('../services/endpoints');
    await window.electron.shell.openExternal(getPortalPricingUrl());
  };

  const handleLearnMore = async () => {
    const { getPortalProfileUrl } = await import('../services/endpoints');
    await window.electron.shell.openExternal(getPortalProfileUrl());
  };

  const phoneSuffix = user?.phone ? user.phone.slice(-4) : '';

  const totalCredits = profileSummary?.totalCreditsRemaining ?? 0;
  const creditItems = profileSummary?.creditItems ?? [];
  const hasCredits = creditItems.length > 0;

  return (
    <div className="absolute bottom-full left-[-0.5rem] mb-1 w-[14.5rem] bg-surface rounded-xl shadow-popover border border-border overflow-hidden z-50 popover-enter">
      {/* Account info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-medium text-foreground truncate">
          {user?.nickname || phoneSuffix}
        </div>
        {phoneSuffix && (
          <div className="text-xs text-secondary mt-0.5">
            ****{phoneSuffix}
          </div>
        )}
      </div>

      {/* Credits section - collapsible */}
      <div className="border-b border-border">
        <button
          type="button"
          onClick={() => setCreditsExpanded(!creditsExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-raised transition-colors"
        >
          <span className="text-xs text-secondary">
            {i18nService.t('authCreditsRemaining')}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground">
              {formatCredits(totalCredits)}{i18nService.t('authCreditsUnit')}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-secondary transition-transform duration-200 ${creditsExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Expanded credit details */}
        {creditsExpanded && (
          <div className="px-4 pb-3">
            {hasCredits ? (
              <div className="divide-y divide-border">
                {creditItems.map((item, idx) => (
                  <CreditItemRow key={idx} item={item} isEn={isEn} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-secondary py-1">
                {i18nService.t('authZeroCredits')}
              </div>
            )}
            <button
              type="button"
              onClick={handleLearnMore}
              className="mt-2 text-xs text-primary hover:underline cursor-pointer"
            >
              {i18nService.t('authLearnMore')}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="py-1">
        <button
          type="button"
          onClick={handleSubscribe}
          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
        >
          {i18nService.t('authValueAddedServices')}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {i18nService.t('authLogout')}
        </button>
      </div>
    </div>
  );
};

const LoginButton: React.FC = () => {
  const { isLoggedIn, isLoading, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const captchaAnswerRef = useRef<HTMLInputElement>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number | null>(null);
  const [isRefreshingCaptcha, setIsRefreshingCaptcha] = useState(false);

  const quotaPlaceholder = useMemo(
    () => ({
      planName: i18nService.t('planFree'),
      subscriptionStatus: 'free',
      creditsLimit: 0,
      creditsUsed: 0,
      creditsRemaining: 0,
    }),
    [],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showLoginDialog) return;
    let cancelled = false;
    setLoginError(null);
    setIsSubmitting(false);
    setLockRemaining(null);
    setShowPassword(false);
    setTimeout(() => usernameInputRef.current?.focus(), 0);
    setIsRefreshingCaptcha(true);
    window.electron.auth
      .getCaptcha()
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setCaptchaToken(res.captchaToken || '');
          setCaptchaQuestion(res.captchaQuestion || '');
          setCaptchaAnswer('');
          setTimeout(() => captchaAnswerRef.current?.focus(), 0);
        } else {
          setLoginError(res.error || '获取验证码失败');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLoginError('获取验证码失败');
      })
      .finally(() => {
        if (cancelled) return;
        setIsRefreshingCaptcha(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showLoginDialog]);

  useEffect(() => {
    if (lockRemaining == null || lockRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setLockRemaining((prev) => {
        if (prev == null) return prev;
        return prev > 1 ? prev - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockRemaining]);

  if (isLoading) {
    return null;
  }

  const handleClick = async () => {
    if (isLoggedIn) {
      setShowMenu(!showMenu);
    } else {
      setShowLoginDialog(true);
    }
  };

  const handleCloseLoginDialog = () => {
    if (isSubmitting) return;
    setShowLoginDialog(false);
    setLoginError(null);
    setCaptchaAnswer('');
  };

  const refreshCaptcha = async () => {
    if (isRefreshingCaptcha) return;
    setLoginError(null);
    setIsRefreshingCaptcha(true);
    try {
      const res = await window.electron.auth.getCaptcha();
      if (res.success) {
        setCaptchaToken(res.captchaToken || '');
        setCaptchaQuestion(res.captchaQuestion || '');
        setCaptchaAnswer('');
        setTimeout(() => captchaAnswerRef.current?.focus(), 0);
      } else {
        setLoginError(res.error || '获取验证码失败');
      }
    } catch {
      setLoginError('获取验证码失败');
    } finally {
      setIsRefreshingCaptcha(false);
    }
  };

  const handleSubmitLogin = async () => {
    if (isSubmitting) return;
    if (lockRemaining != null && lockRemaining > 0) return;
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const res = await window.electron.auth.loginWithPassword({
        username: loginUsername,
        password: loginPassword,
        captchaToken,
        captchaAnswer,
      });
      if (res.success && res.user) {
        dispatch(setLoggedIn({ user: res.user as UserProfile, quota: quotaPlaceholder }));
        setShowLoginDialog(false);
        setLoginPassword('');
        setCaptchaAnswer('');
        return;
      }

      const nextToken = (res as any).captchaToken;
      const nextQuestion = (res as any).captchaQuestion;
      if (typeof nextToken === 'string' && typeof nextQuestion === 'string' && nextToken && nextQuestion) {
        setCaptchaToken(nextToken);
        setCaptchaQuestion(nextQuestion);
        setCaptchaAnswer('');
      }
      const locked = (res as any).locked === true;
      const remainingSeconds = (res as any).remainingSeconds;
      if (locked) {
        setLockRemaining(typeof remainingSeconds === 'number' ? remainingSeconds : null);
      }
      const err = (res as any).error || '登录失败';
      if (typeof err === 'string' && err.includes('登录请求已过期')) {
        setLoginError(`${err}（请检查系统时间是否正确）`);
      } else {
        setLoginError(err);
      }
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex h-7 items-center justify-start gap-2 rounded-md px-1.5 text-[14px] font-normal text-foreground/80 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer"
      >
        {isLoggedIn ? (
          <>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-4 w-4 shrink-0 rounded-full" />
            ) : (
              <UserAvatarIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate max-w-[80px]">{i18nService.t('myAccount')}</span>
          </>
        ) : (
          <>
            <UserAvatarIcon className="h-4 w-4 shrink-0" />
            {i18nService.t('login')}
          </>
        )}
      </button>
      {showMenu && <UserMenu onClose={() => setShowMenu(false)} />}
      {showLoginDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseLoginDialog();
            }
          }}
        >
          <div className="relative w-[44rem] max-w-[94vw] rounded-2xl border border-border bg-surface shadow-popover overflow-hidden">
            <button
              type="button"
              onClick={handleCloseLoginDialog}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-foreground hover:bg-surface-raised transition-colors z-10"
              aria-label="Close"
              disabled={isSubmitting}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative p-6 md:p-7 border-b md:border-b-0 md:border-r border-border">
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(72, 133, 255, 0.18) 0%, rgba(72, 133, 255, 0.04) 40%, rgba(0, 0, 0, 0) 100%)' }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 border border-border flex items-center justify-center overflow-hidden">
                      <img src="logo.png" alt="" className="w-7 h-7 select-none" draggable={false} />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-base font-semibold text-foreground">智信通</div>
                      <div className="text-xs text-secondary">专业智能化客户端（桌面端）</div>
                    </div>
                  </div>

                  <div className="mt-5 text-sm text-foreground/90 leading-6">
                    <div>登录后将以你的智信通身份访问：</div>
                    <div className="mt-2 flex flex-col gap-1 text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        智能体
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        数据广场
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        更多精彩功能
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-[11px] text-secondary leading-5">
                    - 验证码有效期 2 分钟，可随时刷新
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-7">
                <div className="text-lg font-semibold text-foreground">欢迎回来</div>
                <div className="text-xs text-secondary mt-1">使用智信通账号登录</div>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-secondary">账号</div>
                    <div className="relative">
                      <input
                        ref={usernameInputRef}
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmitLogin();
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入账号"
                        autoComplete="username"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-secondary">密码</div>
                    <div className="relative">
                      <input
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmitLogin();
                          }
                        }}
                        type={showPassword ? 'text' : 'password'}
                        className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入密码"
                        autoComplete="current-password"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md text-secondary hover:text-foreground hover:bg-surface-raised"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.81 21.81 0 0 1 5.06-6.94" />
                            <path d="M1 1l22 22" />
                            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.81 21.81 0 0 1-4.87 6.61" />
                            <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-secondary">验证码</div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="text-xs text-primary hover:underline disabled:opacity-60"
                        disabled={isRefreshingCaptcha || isSubmitting}
                      >
                        {isRefreshingCaptcha ? '刷新中…' : '刷新题目'}
                      </button>
                    </div>
                    <div className="text-xs text-secondary">
                      {captchaQuestion ? `题目：${captchaQuestion}` : '题目加载中…'}
                    </div>
                    <input
                      ref={captchaAnswerRef}
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitLogin();
                        }
                      }}
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="请输入答案"
                      inputMode="numeric"
                    />
                  </div>

                  {loginError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      {loginError}
                    </div>
                  )}
                  {lockRemaining != null && lockRemaining > 0 && (
                    <div className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-secondary">
                      登录被锁定，请等待 {lockRemaining} 秒后重试
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitLogin}
                    className="h-10 rounded-xl bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                    disabled={
                      isSubmitting
                      || !loginUsername.trim()
                      || !loginPassword
                      || !captchaAnswer.trim()
                      || (lockRemaining != null && lockRemaining > 0)
                      || isRefreshingCaptcha
                    }
                  >
                    {isSubmitting ? '登录中…' : '登录'}
                  </button>

                  <div className="text-[11px] text-secondary leading-5">
                    登录即表示你同意在桌面端使用智信通的账号体系完成身份鉴权。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginButton;
