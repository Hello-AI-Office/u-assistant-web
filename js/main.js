(function () {
  if (location.hash === '#contact') {
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  var isWeChat = /MicroMessenger/i.test(navigator.userAgent || '');

  function lockWeChatFont() {
    if (typeof WeixinJSBridge === 'undefined') return;
    var apply = function () {
      WeixinJSBridge.invoke('setFontSizeCallback', { fontSize: 0 });
    };
    apply();
    WeixinJSBridge.on('menu:setfont', apply);
  }

  if (isWeChat) {
    if (typeof WeixinJSBridge === 'object') lockWeChatFont();
    else document.addEventListener('WeixinJSBridgeReady', lockWeChatFont, false);
  }

  function absoluteUrl(path) {
    return new URL(path, location.href).href;
  }

  var shareTitle = 'U助理 · AI 服务助手';
  var shareDesc = 'U助理是专为销售人员打造的 AI 服务助手。';
  var shareImage = absoluteUrl('static/share-cover.jpg');
  var shareUrl = new URL('index.html', location.href).href.split('#')[0];

  function upsertMeta(attr, key, value) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:locale', 'zh_CN');
  upsertMeta('property', 'og:site_name', 'U助理');
  upsertMeta('property', 'og:title', shareTitle);
  upsertMeta('property', 'og:description', shareDesc);
  upsertMeta('property', 'og:image', shareImage);
  upsertMeta('property', 'og:image:width', '600');
  upsertMeta('property', 'og:image:height', '600');
  upsertMeta('property', 'og:url', shareUrl);
  upsertMeta('name', 'twitter:card', 'summary');
  upsertMeta('itemprop', 'name', shareTitle);
  upsertMeta('itemprop', 'description', shareDesc);
  upsertMeta('itemprop', 'image', shareImage);

  var imageSrc = document.querySelector('link[rel="image_src"]');
  if (!imageSrc) {
    imageSrc = document.createElement('link');
    imageSrc.rel = 'image_src';
    document.head.appendChild(imageSrc);
  }
  imageSrc.href = shareImage;

  function syncNavHeight() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    document.documentElement.style.setProperty('--nav-h', header.offsetHeight + 'px');
  }

  const header = document.querySelector('.site-header');
  const backTop = document.querySelector('.back-top');
  const progress = document.querySelector('.scroll-progress');

  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (backTop) backTop.classList.toggle('is-visible', y > 420);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      progress.style.width = pct + '%';
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  const video = document.querySelector('#hero-video, .hero-split__media video, .video-frame video');
  const soundBtn = document.querySelector('.video-sound');

  if (video) {
    const muteOn = () => {
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute('muted', '');
    };

    const muteOff = () => {
      video.defaultMuted = false;
      video.muted = false;
      video.removeAttribute('muted');
      try {
        video.volume = 1;
      } catch (_) {}
    };

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        return p.catch(() => false);
      }
      return Promise.resolve(true);
    };

    muteOn();
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const armPlay = () => {
      if (!video.paused) return;
      tryPlay();
    };

    ['loadeddata', 'canplay', 'loadedmetadata'].forEach((name) => {
      video.addEventListener(name, armPlay);
    });
    document.addEventListener('WeixinJSBridgeReady', armPlay, false);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) armPlay();
    });
    armPlay();

    const syncSoundUi = () => {
      if (!soundBtn) return;
      const on = !video.muted;
      soundBtn.classList.toggle('is-on', on);
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', on ? '关闭声音' : '开启声音');
      const text = soundBtn.querySelector('.video-sound__text');
      if (text) text.textContent = on ? '声音已开' : '开启声音';
    };

    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (video.muted) {
          muteOff();
          tryPlay().then((ok) => {
            if (ok === false && video.paused) {
              muteOn();
            }
            syncSoundUi();
          });
        } else {
          muteOn();
          syncSoundUi();
        }
        syncSoundUi();
      });
      syncSoundUi();
    }
  }

  // Soft spotlight on interactive cards
  document.querySelectorAll('.feature-card, .core-card, .plan-card, .cta-band').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--spot-x', x + '%');
      card.style.setProperty('--spot-y', y + '%');
    });
  });

  function toast(message) {
    var el = document.querySelector('.share-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'share-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      el.classList.remove('is-on');
    }, 2200);
  }

  function copyText(text) {
    function legacy() {
      return new Promise(function (resolve, reject) {
        var input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        try {
          document.execCommand('copy') ? resolve() : reject();
        } catch (err) {
          reject(err);
        }
        document.body.removeChild(input);
      });
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(legacy);
    }
    return legacy();
  }

  var cardHtml =
    '<div class="wx-card">' +
      '<div class="wx-card__text"><strong>' + shareTitle + '</strong><span>' + shareDesc + '</span></div>' +
      '<img alt="U助理" width="72" height="72" src="' + shareImage + '" />' +
    '</div>';

  var mask = document.createElement('div');
  mask.className = 'share-mask';
  mask.hidden = true;
  mask.innerHTML =
    '<div class="share-guide" style="display:none">' +
      '<button type="button" class="share-x" aria-label="关闭">×</button>' +
      '<p class="share-guide__title">用浏览器分享给好友</p>' +
      '<div class="share-steps">' +
        '<p class="share-step"><span class="nobr">1. 点右上角···，</span>选择「默认浏览器打开」</p>' +
        '<p class="share-step">2. 点「分享」，再点「发送给微信好友」</p>' +
      '</div>' +
      cardHtml +
    '</div>' +
    '<div class="share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-sheet-title">' +
      '<button type="button" class="share-x" aria-label="关闭">×</button>' +
      '<p class="share-sheet__title" id="share-sheet-title">分享给微信好友</p>' +
      cardHtml +
      '<button type="button" class="btn btn-primary share-send">发送给微信好友</button>' +
      '<button type="button" class="share-copy">复制链接</button>' +
    '</div>';
  document.body.appendChild(mask);

  function fillShareCard() {
    mask.querySelectorAll('.wx-card strong').forEach(function (el) {
      el.textContent = shareTitle;
    });
    mask.querySelectorAll('.wx-card span').forEach(function (el) {
      el.textContent = shareDesc;
    });
    mask.querySelectorAll('.wx-card img').forEach(function (el) {
      if (el.getAttribute('src') !== shareImage) el.src = shareImage;
    });
  }

  function closeShare() {
    mask.hidden = true;
    mask.classList.remove('is-wechat');
    document.body.classList.remove('share-open');
  }

  function openShare() {
    var guide = mask.querySelector('.share-guide');
    var sheet = mask.querySelector('.share-sheet');
    if (isWeChat) {
      mask.classList.add('is-wechat');
      if (guide) guide.style.display = 'block';
      if (sheet) sheet.style.display = 'none';
      mask.hidden = false;
      document.body.classList.add('share-open');
      return;
    }
    if (guide) guide.style.display = 'none';
    if (sheet) sheet.style.display = '';
    showShareSheet();
  }

  function showShareSheet() {
    fillShareCard();
    mask.hidden = false;
    document.body.classList.add('share-open');
  }

  function copyAndHint() {
    copyText(shareUrl).then(function () {
      toast('链接已复制');
      closeShare();
    }).catch(function () {
      toast('复制失败，请长按地址栏手动复制');
    });
  }

  function sendToWeChat(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // 必须在这次点击里同步调用。先关掉弹窗或 setTimeout 都会丢掉用户手势，
    // iOS 不会弹出系统分享，也就到不了微信的选好友。
    if (typeof navigator.share !== 'function') {
      toast('请点「复制链接」，打开微信后粘贴发送给好友');
      return;
    }
    var pending;
    try {
      pending = navigator.share({ url: shareUrl });
    } catch (err) {
      toast('请点「复制链接」，打开微信后粘贴发送给好友');
      return;
    }
    Promise.resolve(pending).then(function () {
      closeShare();
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      toast('请点「复制链接」，打开微信后粘贴发送给好友');
    });
  }

  mask.addEventListener('click', function (event) {
    if (event.target === mask) closeShare();
  });
  mask.querySelectorAll('.share-x').forEach(function (button) {
    button.addEventListener('click', closeShare);
  });
  var sendBtn = mask.querySelector('.share-send');
  if (sendBtn) sendBtn.addEventListener('click', sendToWeChat);
  mask.querySelectorAll('.share-copy').forEach(function (button) {
    button.addEventListener('click', copyAndHint);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !mask.hidden) closeShare();
  });

  var nav = document.querySelector('.nav-inner');
  var cta = nav && nav.querySelector('.nav-cta');
  if (nav && cta) {
    var shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'nav-share';
    shareBtn.textContent = '分享';
    shareBtn.setAttribute('aria-label', '分享给微信好友');
    nav.insertBefore(shareBtn, cta);
    shareBtn.addEventListener('click', openShare);
  }

  syncNavHeight();
  window.addEventListener('resize', syncNavHeight);
  window.addEventListener('orientationchange', syncNavHeight);

})();
