/* NexorLab – scripts autonomes, sans dépendance externe */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const root = document.documentElement;
  const themeSwitch = document.getElementById('theme-switch');
  const themeName = document.getElementById('theme-name');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(next) {
    const theme = next === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;
    themeSwitch.setAttribute('aria-checked', String(theme === 'dark'));
    themeSwitch.setAttribute('aria-label', theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
    themeName.textContent = theme === 'dark' ? 'Sombre' : 'Clair';
    if (typeof updatePaletteUI === 'function') updatePaletteUI();
    try { localStorage.setItem('nexorlab-theme', theme); } catch (e) { /* stockage non disponible */ }
  }
  // Premier affichage effectué après le chargement des préférences de palette.
  themeSwitch.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  const menu = document.getElementById('site-nav');
  const menuButton = document.getElementById('menu-toggle');
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  }));


  // Éditeur de couleurs : choix immédiat, 5 palettes et valeurs HEX personnalisées.
  const palettes = Object.freeze({
    citron: { name: 'Citron', accent: '#A3E635', darkBg: '#0A101B', lightBg: '#F5F7F2' },
    violet: { name: 'Violet', accent: '#A855F7', darkBg: '#130F24', lightBg: '#F7F4FD' },
    cyan: { name: 'Cyan', accent: '#22D3EE', darkBg: '#091722', lightBg: '#EFF9FC' },
    ambre: { name: 'Ambre', accent: '#F59E0B', darkBg: '#1A1410', lightBg: '#FFF8EE' },
    cobalt: { name: 'Cobalt', accent: '#3B82F6', darkBg: '#0D1630', lightBg: '#F2F6FF' }
  });
  const savedPaletteKey = 'nexorlab-palette-v4';
  const paletteTrigger = document.getElementById('palette-trigger');
  const palettePanel = document.getElementById('palette-panel');
  const paletteControl = document.getElementById('palette-control');
  const paletteClose = document.getElementById('palette-close');
  const accentColor = document.getElementById('palette-accent-color');
  const accentHex = document.getElementById('palette-accent-hex');
  const bgColor = document.getElementById('palette-bg-color');
  const bgHex = document.getElementById('palette-bg-hex');
  const presetButtons = [...document.querySelectorAll('[data-preset]')];
  let paletteState = { ...palettes.citron, preset: 'citron' };
  const hexValid = (h) => typeof h === 'string' && /^#[0-9A-F]{6}$/i.test(h);
  const normalizeHex = (h) => String(h || '').toUpperCase();
  const toRgb = (h) => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
  const rgbHex = (rgb) => '#' + rgb.map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
  const mixHex = (a,b,k) => rgbHex(toRgb(a).map((v,i) => v*(1-k)+toRgb(b)[i]*k));
  const channel = n => { let c=n/255; return c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4; };
  const luminosity = hex => { const [r,g,b]=toRgb(hex);return .2126*channel(r)+.7152*channel(g)+.0722*channel(b); };
  const contrast = (a,b) => {let x=luminosity(a),y=luminosity(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function readableAccent(accent,bg) {
    if(contrast(accent,bg)>=4.5) return accent;
    const target = luminosity(bg)>.22?'#071224':'#FFFFFF';
    for(let i=1;i<=30;i++){ const candidate=mixHex(accent,target,i/30); if(contrast(candidate,bg)>=4.5)return candidate; }
    return target;
  }
  function hue(hex) { const [r,g,b]=toRgb(hex).map(v=>v/255); const mx=Math.max(r,g,b), mn=Math.min(r,g,b),d=mx-mn; if(!d)return 0; let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360; }
  function storePalette(){ try{localStorage.setItem(savedPaletteKey,JSON.stringify(paletteState));}catch(e){/* fichier local / accès restreint */} }
  function setVar(name,val){root.style.setProperty(name,val);}
  function updatePaletteUI() {
    const light=root.dataset.theme==='light', bg=light?paletteState.lightBg:paletteState.darkBg;
    const accent=paletteState.accent;
    const lightSurface=luminosity(bg)>.25;
    const ink=lightSurface?'#111827':'#F7F9F3';
    const muted=lightSurface?'#526372':'#A3B2BE';
    const onAccent=contrast(accent,'#111827') >= contrast(accent,'#FFFFFF')?'#111827':'#FFFFFF';
    const rgb=toRgb(accent);
    setVar('--bg',bg);
    setVar('--bg-2',mixHex(bg,lightSurface?'#B7C5CA':'#FFFFFF',lightSurface?.13:.032));
    setVar('--panel',mixHex(bg,'#FFFFFF',lightSurface?.84:.055));
    setVar('--panel-raised',mixHex(bg,'#FFFFFF',lightSurface?.63:.105));
    setVar('--step-bg',mixHex(bg,'#FFFFFF',lightSurface?.8:.045));
    setVar('--header-bg',`rgba(${toRgb(bg).join(',')},.88)`);
    setVar('--ink',ink);setVar('--muted',muted);
    setVar('--soft',lightSurface?'#667888':'#728397');
    setVar('--line',lightSurface?'rgba(17,24,39,.10)':'rgba(231,242,226,.105)');
    setVar('--border-strong',lightSurface?'rgba(17,24,39,.18)':'rgba(231,242,226,.18)');
    setVar('--shadow',lightSurface?'rgba(17,24,39,.09)':'rgba(0,0,0,.35)');
    setVar('--accent-bright',accent);
    setVar('--accent',readableAccent(accent,bg));
    setVar('--accent-hover',mixHex(accent,lightSurface?'#000000':'#FFFFFF',lightSurface?.10:.16));
    setVar('--accent-on',onAccent);
    setVar('--accent-wash',`rgba(${rgb.join(',')},${lightSurface?.1:.105})`);
    setVar('--cta-bg',accent);setVar('--cta-ink',onAccent);
    setVar('--halo-a',`rgba(${rgb.join(',')},${lightSurface?.18:.13})`);
    setVar('--halo-b',`rgba(${rgb.join(',')},${lightSurface?.075:.09})`);
    setVar('--ambient-grid',`rgba(${rgb.join(',')},${lightSurface?.075:.05})`);
    setVar('--particle-rgb',rgb.join(','));
    setVar('--brand-hue-rotate',`${Math.round(hue(accent)-hue('#A3E635'))}deg`);
    setVar('--demo-bg',mixHex(paletteState.darkBg,'#111B2A',.23));
    setVar('--demo-header',mixHex(paletteState.darkBg,'#FFFFFF',.12));
    if(metaTheme) metaTheme.setAttribute('content',bg);
    document.getElementById('palette-trigger-dot').style.background=accent;
    accentHex.value=accent;accentColor.value=accent;
    bgHex.value=bg;bgColor.value=bg;
    document.getElementById('palette-bg-label').textContent=light?'Fond clair':'Fond sombre';
    document.getElementById('palette-current').textContent=palettes[paletteState.preset]?.name || 'Personnalisé';
    presetButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===paletteState.preset)));
  }
  try {
    const saved=JSON.parse(localStorage.getItem(savedPaletteKey));
    if (saved && hexValid(saved.accent) && hexValid(saved.darkBg) && hexValid(saved.lightBg)) {
      paletteState={accent:normalizeHex(saved.accent),darkBg:normalizeHex(saved.darkBg),lightBg:normalizeHex(saved.lightBg),preset:palettes[saved.preset]?saved.preset:'custom'};
    }
  } catch(e){/* Aucun réglage enregistré */}
  applyTheme(root.dataset.theme);
  function openPalette(open){
    palettePanel.hidden=!open;
    paletteTrigger.setAttribute('aria-expanded',String(open));
    paletteTrigger.setAttribute('aria-label',open?'Fermer les réglages de couleurs':'Personnaliser les couleurs');
    if(open){menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}
  }
  paletteTrigger.addEventListener('click',()=>openPalette(palettePanel.hidden));
  paletteClose.addEventListener('click',()=>{openPalette(false);paletteTrigger.focus();});
  document.addEventListener('pointerdown',e=>{if(!palettePanel.hidden&&!paletteControl.contains(e.target))openPalette(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!palettePanel.hidden){openPalette(false);paletteTrigger.focus();}});
  presetButtons.forEach(b=>b.addEventListener('click',()=>{
    paletteState={...palettes[b.dataset.preset],preset:b.dataset.preset};
    updatePaletteUI();storePalette();
  }));
  function changeCustom(field,value){
    if(!hexValid(value))return;
    paletteState[field]=normalizeHex(value);paletteState.preset='custom';
    updatePaletteUI();storePalette();
  }
  [[accentColor,'accent'],[bgColor,null]].forEach(([input,field])=>input.addEventListener('input',()=>changeCustom(field|| (root.dataset.theme==='dark'?'darkBg':'lightBg'),input.value)));
  [[accentHex,'accent'],[bgHex,null]].forEach(([input,field])=>{
    input.addEventListener('input',()=>{
      const valid=hexValid(input.value);input.classList.toggle('invalid',!valid);
      if(valid){changeCustom(field|| (root.dataset.theme==='dark'?'darkBg':'lightBg'),input.value);input.classList.remove('invalid');}
    });
    input.addEventListener('blur',()=>{input.classList.remove('invalid');updatePaletteUI();});
  });
  document.getElementById('palette-reset').addEventListener('click',()=>{
    paletteState={...palettes.citron,preset:'citron'};updatePaletteUI();storePalette();
  });
  // Le bouton de thème rechargera aussi le fond clair/sombre choisi sans perdre la palette.

  // Démo utilisateur : aucune notification réelle n'est déclenchée par ce site.
  const toast = document.getElementById('toast');
  const alertPreview = document.getElementById('alert-preview');
  const previewToggle = document.getElementById('preview-toggle');
  const previewStatus = document.getElementById('preview-status');
  const inlineDemo = document.getElementById('simulate-inline');
  let alertsEnabled = true;
  let toastTimeout;
  function dismissToast() {
    toast.classList.remove('show');
    window.clearTimeout(toastTimeout);
  }
  function simulate() {
    if (!alertsEnabled) {
      previewToggle.focus();
      return;
    }
    toast.classList.remove('show');
    alertPreview.classList.remove('pulse');
    void alertPreview.offsetWidth;
    alertPreview.classList.add('pulse');
    window.requestAnimationFrame(() => toast.classList.add('show'));
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(dismissToast, 6500);
  }
  [document.getElementById('hero-demo'), document.getElementById('product-demo'), inlineDemo].forEach((btn) => btn.addEventListener('click', simulate));
  document.getElementById('toast-close').addEventListener('click', dismissToast);
  previewToggle.addEventListener('click', () => {
    alertsEnabled = !alertsEnabled;
    previewToggle.classList.toggle('on', alertsEnabled);
    previewToggle.setAttribute('aria-checked', String(alertsEnabled));
    previewToggle.setAttribute('aria-label', alertsEnabled ? 'Désactiver les alertes de démonstration' : 'Activer les alertes de démonstration');
    previewStatus.textContent = alertsEnabled ? 'Prêtes à vous prévenir' : 'Alertes mises en pause';
    alertPreview.classList.toggle('is-disabled', !alertsEnabled);
    inlineDemo.disabled = !alertsEnabled;
    if (!alertsEnabled) dismissToast();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dismissToast(); });

  // Apparition des blocs à mesure du défilement.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); obs.unobserve(entry.target); }
      }
    }, { threshold: 0.11, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('in-view'));

  // Soulignage du lien correspondant à la section visible.
  const links = Array.from(document.querySelectorAll('.site-nav a'));
  if ('IntersectionObserver' in window) {
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id));
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    ['accueil', 'notify', 'fonctionnement', 'studio'].forEach(id => {
      const el = document.getElementById(id); if (el) secObs.observe(el);
    });
  }

  // Points flottants subtilement reliés. Respect des préférences de mouvement réduit.
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext && canvas.getContext('2d');
  const motionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (ctx && !motionDisabled.matches) {
    let w = 0, h = 0, nodes = [], animation, last = 0;
    function resize() {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(43, Math.floor(w / 31));
      nodes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random()-.5)*.16, vy:(Math.random()-.5)*.13,r:.5 + Math.random()*1.1 }));
    }
    function draw(time) {
      if (document.hidden) { animation = null; return; }
      animation = window.requestAnimationFrame(draw);
      if (time - last < 32) return; last = time;
      ctx.clearRect(0, 0, w, h);
      const bright = root.dataset.theme === 'light';
      const rgb = getComputedStyle(root).getPropertyValue('--particle-rgb').trim() || '163,230,53';
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${rgb},${bright ? .26 : .34})`; ctx.fill();
      });
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
        const a=nodes[i],b=nodes[j]; const dx=a.x-b.x,dy=a.y-b.y; const dist=dx*dx+dy*dy;
        if(dist<15000){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(${rgb},${(1-dist/15000)*.075})`;ctx.lineWidth=.7;ctx.stroke();}
      }
    }
    resize(); animation = window.requestAnimationFrame(draw);
    window.addEventListener('resize', () => { window.cancelAnimationFrame(animation);resize();animation=window.requestAnimationFrame(draw); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !animation) { last=0; animation=window.requestAnimationFrame(draw); } });
  }
})();
