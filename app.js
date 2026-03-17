(function () {
  var data = window.PORTFOLIO_DATA;

  if (!data || !data.site || !Array.isArray(data.topics)) {
    return;
  }

  var totalVideos = data.topics.reduce(function (count, topic) {
    return count + (Array.isArray(topic.videos) ? topic.videos.length : 0);
  }, 0);

  fillHero(data.site, totalVideos, data.topics.length);
  renderTopics(data.topics);
  setupSmoothAnchors();
  setupRevealAnimations();

  function fillHero(site, videosCount, topicsCount) {
    var kicker = document.getElementById('hero-kicker');
    var title = document.getElementById('hero-title');
    var text = document.getElementById('hero-text');
    var metrics = document.getElementById('hero-metrics');

    updateChrome(site);

    if (kicker) {
      kicker.textContent = typeof site.kicker === 'string' ? site.kicker : kicker.textContent;
    }
    if (title) {
      title.textContent = typeof site.heroTitle === 'string' ? site.heroTitle : title.textContent;
    }
    if (text && typeof site.heroText === 'string') {
      text.textContent = site.heroText;
      text.hidden = site.heroText.trim() === '';
    }
    if (metrics) {
      metrics.innerHTML = (site.metrics || []).map(function (metric) {
        var value = String(metric.value || '')
          .replace('{topicsCount}', String(topicsCount))
          .replace('{videosCount}', String(videosCount));
        return [
          '<div class="metric">',
          '<strong class="metric__value">' + escapeHtml(value) + '</strong>',
          '<span class="metric__label">' + escapeHtml(metric.label || '') + '</span>',
          '</div>'
        ].join('');
      }).join('');
    }
  }

  function updateChrome(site) {
    var telegramHandle = getTelegramHandle(site.telegram || '');

    Array.prototype.forEach.call(document.querySelectorAll('[data-brand-text]'), function (element) {
      element.textContent = site.brand || 'Wh1te Dead';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-telegram-link]'), function (element) {
      if (site.telegram) {
        element.href = site.telegram;
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-telegram-handle]'), function (element) {
      var format = element.getAttribute('data-format');
      if (format === 'handle') {
        element.textContent = telegramHandle ? '@' + telegramHandle : '@telegram';
        return;
      }
      element.textContent = telegramHandle ? 'Telegram: @' + telegramHandle : 'Написать в Telegram';
    });
  }

  function renderTopics(topics) {
    var root = document.getElementById('topics-list');
    if (!root) {
      return;
    }

    root.innerHTML = topics.map(function (topic) {
      var panelId = 'topic-panel-' + (topic.id || Math.random().toString(36).slice(2));

      return [
        '<article class="topic-card reveal">',
        '<button class="topic-card__toggle" type="button" aria-expanded="false" aria-controls="' + panelId + '">',
        '<span class="topic-card__accent">' + escapeHtml(topic.accent || 'Тема') + '</span>',
        '<span class="topic-card__count">' + String((topic.videos || []).length) + '</span>',
        '<h3>' + escapeHtml(topic.title || 'Без названия') + '</h3>',
        hasText(topic.summary) ? '<p class="topic-card__summary">' + escapeHtml(topic.summary) + '</p>' : '',
        '<span class="topic-card__chevron" aria-hidden="true"></span>',
        '</button>',
        '<div class="topic-card__panel" id="' + panelId + '">',
        '<div class="topic-card__panel-inner">',
        hasText(topic.description) ? '<p class="topic-card__description">' + escapeHtml(topic.description) + '</p>' : '',
        '<div class="video-grid">' + renderVideos(topic.videos || []) + '</div>',
        '</div>',
        '</div>',
        '</article>'
      ].join('');
    }).join('');

    Array.prototype.forEach.call(root.querySelectorAll('.topic-card__toggle'), function (button) {
      button.addEventListener('click', function () {
        var article = button.closest('.topic-card');
        var isExpanded = button.getAttribute('aria-expanded') === 'true';

        button.setAttribute('aria-expanded', String(!isExpanded));
        article.classList.toggle('is-open', !isExpanded);
      });
    });
  }

  function renderVideos(videos) {
    return videos.map(function (video) {
      return [
        '<article class="video-card">',
        '<div class="video-card__media">' + renderMedia(video) + '</div>',
        '<div class="video-card__body">',
        '<div class="video-card__meta">',
        '<span>' + escapeHtml(video.duration || 'Видео') + '</span>',
        '<span>' + escapeHtml(video.type || 'placeholder') + '</span>',
        '</div>',
        '<h4>' + escapeHtml(video.title || 'Без названия') + '</h4>',
        hasText(video.description) ? '<p>' + escapeHtml(video.description) + '</p>' : '',
        renderVideoAction(video),
        '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderMedia(video) {
    var type = (video.type || 'placeholder').toLowerCase();
    var url = video.url || '';

    if (type === 'youtube') {
      var youtubeUrl = getYouTubeEmbedUrl(url);
      if (youtubeUrl) {
        return '<iframe src="' + escapeAttribute(youtubeUrl) + '" title="' + escapeAttribute(video.title || 'YouTube video') + '" loading="lazy" allowfullscreen></iframe>';
      }
    }

    if (type === 'vimeo') {
      var vimeoUrl = getVimeoEmbedUrl(url);
      if (vimeoUrl) {
        return '<iframe src="' + escapeAttribute(vimeoUrl) + '" title="' + escapeAttribute(video.title || 'Vimeo video') + '" loading="lazy" allowfullscreen></iframe>';
      }
    }

    if (type === 'mp4' && url) {
      return '<video controls preload="metadata" playsinline src="' + escapeAttribute(url) + '"></video>';
    }

    return [
      '<div class="video-card__placeholder">',
      '<span>' + escapeHtml(video.label || 'Видео скоро будет здесь') + '</span>',
      '</div>'
    ].join('');
  }

  function renderVideoAction(video) {
    if ((video.type === 'link' || video.type === 'youtube' || video.type === 'vimeo') && video.url) {
      return '<a class="video-card__link" href="' + escapeAttribute(video.url) + '" target="_blank" rel="noreferrer">Открыть видео</a>';
    }

    if (video.type === 'mp4' && video.url) {
      return '<a class="video-card__link" href="' + escapeAttribute(video.url) + '" target="_blank" rel="noreferrer">Открыть файл</a>';
    }

    return '<span class="video-card__hint">Ссылка пока не добавлена</span>';
  }

  function setupSmoothAnchors() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (anchor) {
      anchor.addEventListener('click', function (event) {
        var targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') {
          return;
        }

        var target = document.querySelector(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        smoothScrollTo(target, 850);
      });
    });
  }

  function smoothScrollTo(target, duration) {
    var start = window.pageYOffset;
    var targetY = target.getBoundingClientRect().top + window.pageYOffset - 24;
    var distance = targetY - start;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + distance * eased);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  function setupRevealAnimations() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -40px 0px'
    });

    Array.prototype.forEach.call(items, function (item) {
      observer.observe(item);
    });
  }

  function getTelegramHandle(url) {
    var match = url.match(/t\.me\/([^/?#]+)/i);
    return match ? match[1].replace(/^@/, '') : '';
  }

  function getYouTubeEmbedUrl(url) {
    if (!url) {
      return '';
    }

    var shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    var watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    var embedId = shortMatch ? shortMatch[1] : watchMatch ? watchMatch[1] : '';
    return embedId ? 'https://www.youtube.com/embed/' + embedId : '';
  }

  function getVimeoEmbedUrl(url) {
    if (!url) {
      return '';
    }

    var match = url.match(/vimeo\.com\/(\d+)/);
    return match ? 'https://player.vimeo.com/video/' + match[1] : '';
  }

  function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }
})();
