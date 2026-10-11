(() => {
    const style = document.createElement('style');
    style.textContent = `
        #tool-processing-bar{position:fixed;z-index:20000;top:0;left:0;width:100%;height:3px;opacity:0;pointer-events:none;transition:opacity .18s ease}
        #tool-processing-bar.active{opacity:1}
        #tool-processing-bar::after{content:"";display:block;width:34%;height:100%;background:var(--teal,#0f766e);animation:tool-processing-sweep 1.05s ease-in-out infinite}
        #tool-processing-status{position:fixed;z-index:20000;right:20px;bottom:20px;display:flex;align-items:center;gap:11px;padding:12px 16px;border:1px solid var(--line,#dce5e2);border-radius:10px;background:var(--panel,#fff);box-shadow:0 12px 32px rgba(24,45,40,.16);color:var(--ink,#17202a);font:600 14px/1.35 'DM Sans',sans-serif;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
        #tool-processing-status.active{opacity:1;transform:translateY(0)}
        #tool-processing-status .tool-processing-spinner{width:18px;height:18px;flex:0 0 18px;border:2px solid var(--teal-soft,#dff5ef);border-top-color:var(--teal,#0f766e);border-radius:50%;animation:tool-processing-spin .72s linear infinite}
        #tool-processing-status small{display:block;margin-top:2px;color:var(--muted,#66737f);font:400 12px/1.3 'DM Sans',sans-serif}
        @keyframes tool-processing-sweep{0%{transform:translateX(-110%)}100%{transform:translateX(310%)}}
        @keyframes tool-processing-spin{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){#tool-processing-bar::after,#tool-processing-status .tool-processing-spinner{animation:none}#tool-processing-status,#tool-processing-bar{transition:none}}
        @media(max-width:600px){#tool-processing-status{right:12px;bottom:12px;left:12px;justify-content:center}}
    `;
    document.head.append(style);

    const bar = document.createElement('div');
    bar.id = 'tool-processing-bar';
    bar.setAttribute('aria-hidden', 'true');
    const status = document.createElement('div');
    status.id = 'tool-processing-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = '<span class="tool-processing-spinner" aria-hidden="true"></span><span>Processing your request<small>Preparing your result</small></span>';
    document.body.append(bar, status);

    let activeRequests = 0;
    let userActionUntil = 0;
    let shownAt = 0;
    let showTimer;
    let hideTimer;

    const begin = () => {
        activeRequests += 1;
        clearTimeout(hideTimer);
        if (activeRequests === 1) {
            showTimer = window.setTimeout(() => {
                if (!activeRequests) return;
                shownAt = performance.now();
                bar.classList.add('active');
                status.classList.add('active');
            }, 140);
        }
        let finished = false;
        return () => {
            if (finished) return;
            finished = true;
            activeRequests = Math.max(0, activeRequests - 1);
            if (activeRequests) return;
            clearTimeout(showTimer);
            const visibleFor = performance.now() - shownAt;
            const delay = bar.classList.contains('active') ? Math.max(0, 360 - visibleFor) : 0;
            hideTimer = window.setTimeout(() => {
                bar.classList.remove('active');
                status.classList.remove('active');
            }, delay);
        };
    };

    const markUserAction = () => {
        userActionUntil = performance.now() + 1500;
    };
    document.addEventListener('click', markUserAction, true);
    document.addEventListener('submit', markUserAction, true);

    if (typeof window.fetch === 'function') {
        const nativeFetch = window.fetch;
        window.fetch = function (...args) {
            if (performance.now() > userActionUntil) return nativeFetch.apply(this, args);
            const finish = begin();
            const timeout = window.setTimeout(finish, 120000);
            return nativeFetch.apply(this, args).then((response) => {
                const bodyReaders = ['arrayBuffer', 'blob', 'formData', 'json', 'text'];
                let consumed = false;
                bodyReaders.forEach((method) => {
                    if (typeof response[method] !== 'function') return;
                    const readBody = response[method].bind(response);
                    response[method] = (...readerArgs) => {
                        if (consumed) return readBody(...readerArgs);
                        consumed = true;
                        return readBody(...readerArgs).finally(() => {
                            clearTimeout(timeout);
                            finish();
                        });
                    };
                });
                if (!response.body) {
                    clearTimeout(timeout);
                    finish();
                }
                return response;
            }, (error) => {
                clearTimeout(timeout);
                finish();
                throw error;
            });
        };
    }

    if (window.XMLHttpRequest) {
        const nativeSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            if (performance.now() > userActionUntil) return nativeSend.apply(this, args);
            const finish = begin();
            const timeout = window.setTimeout(finish, 120000);
            this.addEventListener('loadend', () => {
                clearTimeout(timeout);
                finish();
            }, { once: true });
            return nativeSend.apply(this, args);
        };
    }
})();
