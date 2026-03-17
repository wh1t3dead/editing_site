(function () {
  var storageKey = 'portfolio-content-draft';
  var sourceData = sanitizeData(window.PORTFOLIO_DATA);
  var state = loadDraft() || clone(sourceData);

  var siteFields = document.getElementById('site-fields');
  var topicsRoot = document.getElementById('admin-topics');
  var summaryRoot = document.getElementById('content-summary');
  var statusRoot = document.getElementById('admin-status');
  var fileInput = document.getElementById('import-file');

  render();
  bindToolbar();

  function bindToolbar() {
    document.getElementById('save-draft').addEventListener('click', function () {
      saveDraft();
      setStatus('Черновик сохранён в браузере.');
    });

    document.getElementById('export-data').addEventListener('click', function () {
      exportData();
      setStatus('Файл content.js скачан. Замени им файл в репозитории.');
    });

    document.getElementById('import-data').addEventListener('click', function () {
      fileInput.click();
    });

    document.getElementById('reset-draft').addEventListener('click', function () {
      state = clone(sourceData);
      localStorage.removeItem(storageKey);
      render();
      setStatus('Черновик сброшен к исходному content.js.');
    });

    document.getElementById('add-topic').addEventListener('click', function () {
      state.topics.push(createTopic());
      render();
      setStatus('Добавлена новая тема.');
    });

    fileInput.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = parseImportedContent(String(reader.result || ''));
          state = sanitizeData(imported);
          render();
          setStatus('Файл импортирован.');
        } catch (error) {
          setStatus('Не удалось импортировать файл. Проверь формат content.js или JSON.');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
  }

  function render() {
    syncChrome();
    renderSiteFields();
    renderTopics();
    renderSummary();
  }

  function syncChrome() {
    var telegramHandle = getTelegramHandle(state.site.telegram || '');

    Array.prototype.forEach.call(document.querySelectorAll('[data-brand-text]'), function (element) {
      element.textContent = state.site.brand || 'Wh1te Dead';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-telegram-link]'), function (element) {
      if (state.site.telegram) {
        element.href = state.site.telegram;
      }
      element.textContent = telegramHandle ? 'Telegram: @' + telegramHandle : 'Telegram';
    });
  }

  function renderSiteFields() {
    siteFields.innerHTML = '';

    siteFields.appendChild(createField('Название', state.site.brand || '', function (value) {
      state.site.brand = value;
      syncChrome();
    }));
    siteFields.appendChild(createField('Kicker', state.site.kicker || '', function (value) {
      state.site.kicker = value;
    }));
    siteFields.appendChild(createField('Заголовок', state.site.heroTitle || '', function (value) {
      state.site.heroTitle = value;
    }, true));
    siteFields.appendChild(createField('Описание', state.site.heroText || '', function (value) {
      state.site.heroText = value;
    }, true));
    siteFields.appendChild(createField('Telegram', state.site.telegram || '', function (value) {
      state.site.telegram = value;
      syncChrome();
    }));
  }

  function renderTopics() {
    topicsRoot.innerHTML = '';

    state.topics.forEach(function (topic, topicIndex) {
      var topicCard = document.createElement('section');
      topicCard.className = 'topic-editor';

      topicCard.innerHTML = [
        '<div class="topic-editor__header">',
        '<div>',
        '<p class="eyebrow">Тема ' + String(topicIndex + 1) + '</p>',
        '<h3>' + escapeHtml(topic.title || 'Новая тема') + '</h3>',
        '</div>',
        '<button class="button button--ghost topic-editor__delete" type="button">Удалить тему</button>',
        '</div>'
      ].join('');

      topicCard.querySelector('.topic-editor__delete').addEventListener('click', function () {
        state.topics.splice(topicIndex, 1);
        render();
        setStatus('Тема удалена.');
      });

      var fieldGrid = document.createElement('div');
      fieldGrid.className = 'field-grid';
      fieldGrid.appendChild(createField('ID', topic.id || '', function (value) {
        topic.id = slugify(value || topic.title || 'topic');
      }));
      fieldGrid.appendChild(createField('Название', topic.title || '', function (value) {
        topic.title = value;
        if (!topic.id) {
          topic.id = slugify(value);
        }
        renderSummary();
      }));
      fieldGrid.appendChild(createField('Акцент', topic.accent || '', function (value) {
        topic.accent = value;
      }));
      fieldGrid.appendChild(createField('Кратко', topic.summary || '', function (value) {
        topic.summary = value;
      }, true));
      fieldGrid.appendChild(createField('Описание', topic.description || '', function (value) {
        topic.description = value;
      }, true));
      topicCard.appendChild(fieldGrid);

      var videosWrap = document.createElement('div');
      videosWrap.className = 'videos-editor';

      topic.videos.forEach(function (video, videoIndex) {
        var videoCard = document.createElement('div');
        videoCard.className = 'video-editor';

        videoCard.innerHTML = [
          '<div class="video-editor__head">',
          '<strong>Видео ' + String(videoIndex + 1) + '</strong>',
          '<button class="button button--ghost video-editor__delete" type="button">Удалить</button>',
          '</div>'
        ].join('');

        videoCard.querySelector('.video-editor__delete').addEventListener('click', function () {
          topic.videos.splice(videoIndex, 1);
          render();
          setStatus('Видео удалено.');
        });

        var videoFields = document.createElement('div');
        videoFields.className = 'field-grid';
        videoFields.appendChild(createField('Название видео', video.title || '', function (value) {
          video.title = value;
          renderSummary();
        }));
        videoFields.appendChild(createSelectField('Тип', video.type || 'placeholder', [
          'placeholder',
          'youtube',
          'vimeo',
          'mp4',
          'link'
        ], function (value) {
          video.type = value;
        }));
        videoFields.appendChild(createField('Ссылка / путь', video.url || '', function (value) {
          video.url = value;
        }));
        videoFields.appendChild(createField('Длительность', video.duration || '', function (value) {
          video.duration = value;
        }));
        videoFields.appendChild(createField('Текст заглушки', video.label || '', function (value) {
          video.label = value;
        }));
        videoFields.appendChild(createField('Описание', video.description || '', function (value) {
          video.description = value;
        }, true));

        videoCard.appendChild(videoFields);
        videosWrap.appendChild(videoCard);
      });

      var addVideo = document.createElement('button');
      addVideo.type = 'button';
      addVideo.className = 'button button--ghost';
      addVideo.textContent = 'Добавить видео';
      addVideo.addEventListener('click', function () {
        topic.videos.push(createVideo());
        render();
        setStatus('Добавлено новое видео.');
      });

      topicCard.appendChild(videosWrap);
      topicCard.appendChild(addVideo);
      topicsRoot.appendChild(topicCard);
    });
  }

  function renderSummary() {
    var videosCount = state.topics.reduce(function (sum, topic) {
      return sum + topic.videos.length;
    }, 0);

    summaryRoot.innerHTML = [
      '<div class="summary-pill"><strong>' + String(state.topics.length) + '</strong><span>тем</span></div>',
      '<div class="summary-pill"><strong>' + String(videosCount) + '</strong><span>видео</span></div>',
      state.topics.map(function (topic) {
        return '<div class="summary-line"><strong>' + escapeHtml(topic.title || 'Без названия') + '</strong><span>' + String(topic.videos.length) + ' видео</span></div>';
      }).join('')
    ].join('');
  }

  function createField(label, value, onInput, isTextarea) {
    var wrap = document.createElement('label');
    wrap.className = 'field';

    var title = document.createElement('span');
    title.className = 'field__label';
    title.textContent = label;
    wrap.appendChild(title);

    var input = document.createElement(isTextarea ? 'textarea' : 'input');
    if (!isTextarea) {
      input.type = 'text';
    }
    input.value = value;
    input.addEventListener('input', function () {
      onInput(input.value);
    });
    wrap.appendChild(input);
    return wrap;
  }

  function createSelectField(label, value, options, onInput) {
    var wrap = document.createElement('label');
    wrap.className = 'field';

    var title = document.createElement('span');
    title.className = 'field__label';
    title.textContent = label;
    wrap.appendChild(title);

    var select = document.createElement('select');
    options.forEach(function (option) {
      var element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      element.selected = option === value;
      select.appendChild(element);
    });
    select.addEventListener('change', function () {
      onInput(select.value);
    });
    wrap.appendChild(select);
    return wrap;
  }

  function exportData() {
    var fileContents = 'window.PORTFOLIO_DATA = ' + JSON.stringify(state, null, 2) + ';\n';
    var blob = new Blob([fileContents], { type: 'text/javascript;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'content.js';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function saveDraft() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(storageKey);
      return raw ? sanitizeData(JSON.parse(raw)) : null;
    } catch (error) {
      return null;
    }
  }

  function setStatus(message) {
    statusRoot.textContent = message;
  }

  function parseImportedContent(text) {
    var cleaned = text
      .replace(/^window\.PORTFOLIO_DATA\s*=\s*/, '')
      .replace(/;\s*$/, '');
    return JSON.parse(cleaned);
  }

  function sanitizeData(input) {
    var data = clone(input || {});
    data.site = data.site || {};
    data.topics = Array.isArray(data.topics) ? data.topics : [];
    data.topics = data.topics.map(function (topic) {
      topic.id = topic.id || slugify(topic.title || 'topic');
      topic.title = topic.title || 'Новая тема';
      topic.accent = topic.accent || '';
      topic.summary = topic.summary || '';
      topic.description = topic.description || '';
      topic.videos = Array.isArray(topic.videos) ? topic.videos : [];
      topic.videos = topic.videos.map(function (video) {
        return {
          title: video.title || 'Новое видео',
          type: video.type || 'placeholder',
          url: video.url || '',
          duration: video.duration || '',
          label: video.label || '',
          description: video.description || ''
        };
      });
      return topic;
    });
    return data;
  }

  function createTopic() {
    return {
      id: 'new-topic-' + Date.now(),
      title: 'Новая тема',
      accent: 'Новый акцент',
      summary: '',
      description: '',
      videos: [createVideo()]
    };
  }

  function createVideo() {
    return {
      title: 'Новое видео',
      type: 'placeholder',
      url: '',
      duration: '',
      label: 'Добавь ссылку',
      description: ''
    };
  }

  function getTelegramHandle(url) {
    var match = url.match(/t\.me\/([^/?#]+)/i);
    return match ? match[1].replace(/^@/, '') : '';
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '');
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
