(function(){
  'use strict';

  /* ── Respect prefers-reduced-motion ─────────────────────────────────── */
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  /* ── Elements to animate (never inside .hero) ───────────────────────── */
  var TARGETS = [
    '.why-card','.feat','.ben',
    '.rev-card','.blog-card','.svc-card',
    '.proc-card','.img-wrap','.sb-card',
    '.info-box','.ba-item','.page-text > p',
    '.page-text > h2','.page-text > h3','.page-text > ul'
  ].join(',');

  document.querySelectorAll(TARGETS).forEach(function(el){
    if(el.closest('.hero') || el.hasAttribute('data-m')) return;
    el.setAttribute('data-m','');
  });

  /* ── Stagger children in common grids ───────────────────────────────── */
  var GRIDS = '.why-grid,.svc-grid,.proc-grid,.feats,.ben-list,.rev-grid,.blog-grid,.three-col,.four-col,.ba-grid';
  document.querySelectorAll(GRIDS).forEach(function(grid){
    Array.from(grid.children).forEach(function(child,i){
      if(i > 0 && i < 6 && !child.hasAttribute('data-delay')){
        child.setAttribute('data-delay', String(i));
      }
    });
  });

  /* ── two-col: left side from left, right side from right ────────────── */
  document.querySelectorAll('.two-col').forEach(function(col){
    var kids = Array.from(col.children);
    if(kids[0] && !kids[0].hasAttribute('data-m')) kids[0].setAttribute('data-m','left');
    if(kids[1] && !kids[1].hasAttribute('data-m')) kids[1].setAttribute('data-m','right');
  });

  /* ── IntersectionObserver for scroll animations ──────────────────────── */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('m-in'); io.unobserve(e.target); }
    });
  },{threshold:0.08, rootMargin:'0px 0px -32px 0px'});

  document.querySelectorAll('[data-m]').forEach(function(el){ io.observe(el); });

  /* ── Stat counter animation ──────────────────────────────────────────── */
  var sio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      sio.unobserve(e.target);
      var n = e.target.querySelector('.stat-n');
      if(!n || n._done) return;
      n._done = true;
      var orig = n.textContent;
      var num  = parseFloat(orig);
      if(isNaN(num)) return;
      var sfx  = orig.replace(/[0-9.]/g,'');
      var dur  = 1800;
      var t0   = performance.now();
      (function tick(ts){
        var p    = Math.min((ts - t0) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(num * ease) + sfx;
        if(p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  },{threshold:0.5});

  document.querySelectorAll('.stat').forEach(function(el){ sio.observe(el); });

})();
