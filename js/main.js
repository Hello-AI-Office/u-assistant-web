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
    document.documentElement.classList.add('is-wechat');
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
  function revealInView() {
    reveals.forEach((el) => {
      if (el.classList.contains('visible')) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
    });
  }
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
      { threshold: 0.01, rootMargin: '40px 0px 40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
    revealInView();
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView);
    // 部分微信内核不派发首屏 IntersectionObserver，不滑就一直是透明
    setTimeout(revealInView, 400);
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

    var isAndroid = /Android/i.test(navigator.userAgent || '');

    muteOn();
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('x5-video-player-fullscreen', 'false');
    // 安卓微信只有同层播放器（h5-page）才会静音自动播；h5 会停在封面，直到有一次点击
    if (isWeChat && isAndroid) {
      video.setAttribute('x5-video-player-type', 'h5-page');
      video.preload = 'auto';
    }

    // 微信 X5 会按视频原始高度（1080）撑开占位，文案被顶到下一屏。窄屏按 16:9 写死盒子。
    const pinHeroVideo = () => {
      const inner = video.closest('.video-frame__inner');
      const media = video.closest('.hero-split__media');
      const narrow = window.matchMedia('(max-width: 980px)').matches || isWeChat;
      if (!narrow) {
        [inner, media, video].forEach((el) => {
          if (!el) return;
          ['height', 'max-height', 'padding-bottom', 'overflow', 'position', 'top', 'left', 'width', 'min-height'].forEach((prop) => {
            el.style.removeProperty(prop);
          });
        });
        return;
      }
      const width = (inner && (inner.clientWidth || inner.parentElement.clientWidth)) || 0;
      if (!width) return;
      const height = Math.round(width * 9 / 16);
      if (inner) {
        inner.style.setProperty('height', height + 'px', 'important');
        inner.style.setProperty('max-height', height + 'px', 'important');
        inner.style.setProperty('padding-bottom', '0', 'important');
        inner.style.setProperty('overflow', 'hidden', 'important');
      }
      if (media) {
        media.style.setProperty('min-height', '0', 'important');
        media.style.setProperty('max-height', (height + 8) + 'px', 'important');
        media.style.setProperty('overflow', 'hidden', 'important');
      }
      video.style.setProperty('position', 'absolute', 'important');
      video.style.setProperty('top', '0', 'important');
      video.style.setProperty('left', '0', 'important');
      video.style.setProperty('width', '100%', 'important');
      video.style.setProperty('height', '100%', 'important');
      video.style.setProperty('max-height', '100%', 'important');
    };

    pinHeroVideo();
    requestAnimationFrame(pinHeroVideo);
    if (isWeChat) {
      const copy = document.querySelector('.hero-split__copy');
      const paintCopy = () => {
        if (!copy) return;
        void copy.offsetHeight;
      };
      paintCopy();
      window.addEventListener('load', paintCopy);
      setTimeout(paintCopy, 250);
    }
    ['loadedmetadata', 'loadeddata', 'canplay', 'resize'].forEach((name) => {
      video.addEventListener(name, pinHeroVideo);
    });
    window.addEventListener('resize', pinHeroVideo);
    window.addEventListener('orientationchange', pinHeroVideo);

    // 安卓微信在 WeixinJSBridgeReady 之前调用 play() 会被拒绝，并且这次失败会把后续非点击的 play() 也锁死。
    // 有声的 play() 同样会被拒绝并锁死，所以自动播放必须先静音，画面起来后再尝试开声。
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var wechatPlayUnlocked = !isWeChat;
    var playbackChosen = false;
    var soundGestureBound = false;
    var soundOpened = false;

    const openSoundOnFirstTouch = () => {
      if (soundGestureBound || soundOpened) return;
      soundGestureBound = true;
      const unlock = (e) => {
        if (soundBtn && e.target && soundBtn.contains(e.target)) return;
        muteOff();
        const p = video.play();
        const done = (failed) => {
          if (failed && video.paused) {
            muteOn();
            video.play();
          } else {
            soundOpened = true;
          }
          document.removeEventListener('touchstart', unlock, true);
          document.removeEventListener('pointerdown', unlock, true);
          document.removeEventListener('click', unlock, true);
          syncSoundUi();
        };
        if (p && typeof p.then === 'function') p.then(function () { done(false); }, function () { done(true); });
        else done(false);
      };
      document.addEventListener('touchstart', unlock, true);
      document.addEventListener('pointerdown', unlock, true);
      document.addEventListener('click', unlock, true);
    };

    const tryOpenSound = () => {
      if (soundOpened || video.paused) {
        syncSoundUi();
        return;
      }
      if (isWeChat || isIOS) {
        openSoundOnFirstTouch();
        syncSoundUi();
        return;
      }
      var mark = video.currentTime;
      muteOff();
      setTimeout(function () {
        if (video.paused || video.currentTime <= mark) {
          muteOn();
          tryPlay().then(function () {
            openSoundOnFirstTouch();
            syncSoundUi();
          });
          return;
        }
        soundOpened = true;
        syncSoundUi();
      }, 120);
    };

    const startPlayback = () => {
      if (isWeChat && !wechatPlayUnlocked) return;
      if (playbackChosen) {
        if (video.paused && !soundOpened) {
          muteOn();
          tryPlay();
        }
        return;
      }
      playbackChosen = true;
      muteOn();
      tryPlay().then(function (ok) {
        if (ok === false || video.paused) {
          openSoundOnFirstTouch();
          syncSoundUi();
          return;
        }
        tryOpenSound();
      });
    };

    const playFromWeChatBridge = () => {
      const start = () => {
        wechatPlayUnlocked = true;
        startPlayback();
      };
      if (window.WeixinJSBridge && typeof WeixinJSBridge.invoke === 'function') {
        WeixinJSBridge.invoke('getNetworkType', {}, start);
      } else {
        start();
      }
    };

    ['loadeddata', 'canplay', 'loadedmetadata'].forEach((name) => {
      video.addEventListener(name, startPlayback);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) startPlayback();
    });

    if (isWeChat) {
      if (window.WeixinJSBridge) playFromWeChatBridge();
      else document.addEventListener('WeixinJSBridgeReady', playFromWeChatBridge, false);
    } else {
      startPlayback();
    }

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
