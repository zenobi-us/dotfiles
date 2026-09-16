/*!
 * lightbox v1 — figure viewer for static reports.
 *
 * Include it and configure it from the script tag. The script injects its own
 * CSS and its own dialog markup, so the host page needs no lightbox markup and
 * no lightbox styles.
 *
 *   <script src="../../assets/lightbox/v1/lightbox.js"
 *           data-figures="figure"
 *           data-caption="figcaption"
 *           data-hint="Click image to zoom &middot; Esc to close"
 *           defer></script>
 *
 * Attributes, all optional:
 *
 *   data-figures         selector for slides, default "figure". Each match
 *                        needs one <img>. Matches without an <img> are skipped.
 *   data-caption         caption selector inside a figure, default "figcaption".
 *   data-zoom            "false" turns off click-to-zoom. Default on.
 *   data-backdrop-close  "false" turns off click-outside-to-close. Default on.
 *   data-hint            corner hint text. Empty or absent hides the hint.
 *   data-loop            "false" stops at the ends instead of wrapping.
 *                        Default on.
 *   data-label           dialog aria-label, default "Image viewer".
 *
 * This file is pinned at v1. Published reports link to it forever, so its
 * behaviour must not change. Breaking changes go in assets/lightbox/v2/.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  function attr(name, fallback) {
    var value = script.getAttribute('data-' + name);
    return value === null || value === '' ? fallback : value;
  }

  function flag(name) {
    return script.getAttribute('data-' + name) !== 'false';
  }

  var config = {
    figures: attr('figures', 'figure'),
    caption: attr('caption', 'figcaption'),
    hint: attr('hint', ''),
    label: attr('label', 'Image viewer'),
    zoom: flag('zoom'),
    backdropClose: flag('backdrop-close'),
    loop: flag('loop')
  };

  /*
   * Colours come from theme tokens when the host page has them, and fall back
   * to these literals when it does not. That keeps the script a drop-in.
   */
  var CSS = [
    '.lbx{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;',
    'background:var(--color-overlay,rgba(10,9,14,.93));backdrop-filter:blur(3px);}',
    '.lbx[hidden]{display:none!important;}',
    '.lbx__stage{flex:1;min-height:0;display:flex;align-items:center;',
    'justify-content:center;padding:52px 64px 8px;}',
    '.lbx__scroll{flex:1;min-height:0;overflow:auto;display:flex;',
    'align-items:center;justify-content:center;}',
    '.lbx__image{max-width:100%;max-height:100%;object-fit:contain;',
    'border-radius:var(--radius-md,8px);background:#fff;',
    'box-shadow:var(--shadow-overlay,0 12px 48px rgba(0,0,0,.55));}',
    '.lbx--zoomable .lbx__image{cursor:zoom-out;}',
    '.lbx__image--zoomed{max-width:none;max-height:none;cursor:grab;}',
    '.lbx__foot{flex:none;padding:14px 64px 22px;text-align:center;',
    'color:var(--color-overlay-ink,#f2f0f7);}',
    '.lbx__caption{max-width:820px;margin:0 auto;font-size:14px;line-height:1.55;}',
    '.lbx__caption strong{color:var(--color-overlay-accent,#c9b8ff);}',
    '.lbx__caption code{background:var(--color-overlay-surface,rgba(255,255,255,.09));',
    'color:var(--color-overlay-ink,#f2f0f7);}',
    '.lbx__count{margin-top:8px;font-size:12px;letter-spacing:.06em;',
    'text-transform:uppercase;color:var(--color-overlay-ink-muted,#9d97ad);}',
    '.lbx__button{position:absolute;cursor:pointer;',
    'background:var(--color-overlay-surface,rgba(255,255,255,.09));',
    'color:var(--color-overlay-ink,#f2f0f7);',
    'border:1px solid var(--color-overlay-border,rgba(255,255,255,.18));',
    'border-radius:var(--radius-pill,999px);',
    'display:flex;align-items:center;justify-content:center;font-size:22px;',
    'line-height:1;width:44px;height:44px;padding:0;}',
    '.lbx__button[hidden]{display:none!important;}',
    '.lbx__button:hover{background:var(--color-overlay-surface-hover,rgba(255,255,255,.18));}',
    '.lbx__button:focus-visible{outline:2px solid var(--color-overlay-accent,#c9b8ff);',
    'outline-offset:2px;}',
    '.lbx__button--close{top:14px;right:16px;font-size:26px;}',
    '.lbx__button--prev{left:12px;top:50%;transform:translateY(-50%);}',
    '.lbx__button--next{right:12px;top:50%;transform:translateY(-50%);}',
    '.lbx__hint{position:absolute;top:20px;left:20px;font-size:11.5px;',
    'letter-spacing:.05em;text-transform:uppercase;',
    'color:var(--color-overlay-ink-muted,#9d97ad);}',
    '.lbx__thumb{cursor:zoom-in;}',
    '@media(max-width:640px){',
    '.lbx__stage{padding:52px 12px 8px;}',
    '.lbx__foot{padding:12px 16px 18px;}',
    '.lbx__button--prev{left:4px;}.lbx__button--next{right:4px;}}',
    '@media print{.lbx{display:none!important;}}'
  ].join('');

  function injectStyle() {
    var style = document.createElement('style');
    style.setAttribute('data-lightbox', 'v1');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function button(className, label, text) {
    var element = document.createElement('button');
    element.type = 'button';
    element.className = 'lbx__button ' + className;
    element.setAttribute('aria-label', label);
    element.innerHTML = text;
    return element;
  }

  function init() {
    var figures = [].slice.call(document.querySelectorAll(config.figures))
      .filter(function (figure) { return figure.querySelector('img'); });
    if (!figures.length) return;

    injectStyle();

    var root = document.createElement('div');
    root.className = 'lbx' + (config.zoom ? ' lbx--zoomable' : '');
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', config.label);

    if (config.hint) {
      var hint = document.createElement('div');
      hint.className = 'lbx__hint';
      hint.innerHTML = config.hint;
      root.appendChild(hint);
    }

    var closeButton = button('lbx__button--close', 'Close', '&times;');
    var prevButton = button('lbx__button--prev', 'Previous image', '&lsaquo;');
    var nextButton = button('lbx__button--next', 'Next image', '&rsaquo;');
    root.appendChild(closeButton);
    root.appendChild(prevButton);
    root.appendChild(nextButton);

    var image = document.createElement('img');
    image.className = 'lbx__image';
    image.alt = '';

    var scroll = document.createElement('div');
    scroll.className = 'lbx__scroll';
    scroll.appendChild(image);

    var stage = document.createElement('div');
    stage.className = 'lbx__stage';
    stage.appendChild(scroll);
    root.appendChild(stage);

    var caption = document.createElement('div');
    caption.className = 'lbx__caption';
    var count = document.createElement('div');
    count.className = 'lbx__count';

    var foot = document.createElement('div');
    foot.className = 'lbx__foot';
    foot.appendChild(caption);
    foot.appendChild(count);
    root.appendChild(foot);

    document.body.appendChild(root);

    var lastFocus = null;
    var at = 0;

    if (!config.loop && figures.length === 1) {
      prevButton.hidden = true;
      nextButton.hidden = true;
    }

    figures.forEach(function (figure, index) {
      var thumb = figure.querySelector('img');
      thumb.classList.add('lbx__thumb');
      thumb.tabIndex = 0;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute(
        'aria-label',
        'Open image ' + (index + 1) + ' of ' + figures.length
      );
      thumb.addEventListener('click', function () { open(index); });
      thumb.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open(index);
      });
    });

    function show(index) {
      if (config.loop) {
        at = (index + figures.length) % figures.length;
      } else {
        at = Math.min(Math.max(index, 0), figures.length - 1);
      }

      var figure = figures[at];
      var thumb = figure.querySelector('img');
      var figureCaption = config.caption
        ? figure.querySelector(config.caption)
        : null;

      image.classList.remove('lbx__image--zoomed');
      image.src = thumb.getAttribute('src');
      image.alt = thumb.getAttribute('alt') || '';
      caption.innerHTML = figureCaption ? figureCaption.innerHTML : '';
      count.textContent = (at + 1) + ' of ' + figures.length;
      scroll.scrollTop = 0;
      scroll.scrollLeft = 0;

      if (!config.loop) {
        prevButton.hidden = at === 0;
        nextButton.hidden = at === figures.length - 1;
      }
    }

    function open(index) {
      lastFocus = document.activeElement;
      show(index);
      root.hidden = false;
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }

    function close() {
      root.hidden = true;
      image.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () { show(at - 1); });
    nextButton.addEventListener('click', function () { show(at + 1); });

    if (config.backdropClose) {
      root.addEventListener('click', function (event) {
        var target = event.target;
        if (target === root || target === stage || target === scroll) close();
      });
    }

    if (config.zoom) {
      image.addEventListener('click', function (event) {
        event.stopPropagation();
        image.classList.toggle('lbx__image--zoomed');
      });
    } else {
      image.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (root.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(at + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(at - 1);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
