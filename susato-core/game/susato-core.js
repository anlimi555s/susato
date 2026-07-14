// ==================================================================
//  SusatoModel 渲染器核心 v1.1
//  统一入口：图层注入 · 图层修改 · ZIndices 扩展 · compile 钩子
//  不需要 ReplacePatcher、不需要 maplebirch。
//
//  CREDITS
//  画家K — 架构 & 核心代码 & 重构
//  Yisic, 画家K, Cicero, 小鼹鼠, Ki, 冰, 枯木枝修, Phantalis — 贴图 & 测试 & 反馈
// ==================================================================
//
//  发现，珍宝总是易逝，
//  欢愉与狂怒交织——我正注视着你。
//  今夜，请小心你的一举一动。
//  我想时机已到，我想鲜血已经凝固，
//  它仍在渴求更多。那我们还在等什么？
//
//  线缆与锁链（我只是厌倦了视而不见），
//  开始褪色消散（我只是厌倦了视而不见），
//  感觉像一场游戏（我只是厌倦了视而不见），
//  你必须入局（我只是厌倦了视而不见）。
//
//  熄灯。这才是真实的你吗？
//  无法直视你的双眼，你那扭曲的心智。
//  好暗，如此黑暗。我们就在此了结，就在此地，此刻。
//  请告诉我你带了家伙，
//  让我们把夜空点燃，再消逝于长夜。
//
//  那些曾经美好的日子已然远逝，
//  我试着看清这一切究竟为何，却永远无法得知。
//  尽管它已死去，我仍听见那召唤。
//
//  线缆与锁链，开始褪色消散，
//  感觉像一场游戏，你无法逃脱。
//
//  我终于发现：珍宝总是易逝。
//  欢愉早已被遗忘。如今的你，究竟是谁？
//
// ==================================================================
(function () {
  'use strict';

  window.SusatoModel = window.SusatoModel || {};
  var SR = window.SusatoModel.renderer = window.SusatoModel.renderer || {};

  // ================================================================
  //  load-once 守卫 —— susato-core 可能被多个子 mod 各打包一份而加载多次。
  //  只让第一份生效，后续加载直接退出。否则第二份会重置内部钩子/队列，
  //  而 compile 包装器（_susatoCompileHooked 守卫，只装一次）仍读第一份的
  //  钩子数组 → 第二份之后注册的 onCompile 钩子永不执行（时装叠穿失效的真因）。
  //  这道守卫是"稳定抽象层"的前提：被复用几次都保持单例、行为一致。
  // ================================================================
  if (SR._coreLoaded) return;
  SR._coreLoaded = true;

  // ================================================================
  //  ZIndices 扩展 —— 运行时动态给 ZIndices 对象加属性
  //  const ZIndices = {...} 只阻止变量重赋值，不阻止属性修改，
  //  所以这里直接赋值即可，不需要 ReplacePatcher 文本替换。
  // ================================================================

  var _zQueue = [];

  function _applyZ(map) {
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!(k in ZIndices)) ZIndices[k] = map[k];
    }
  }

  SR.extendZIndices = function (map) {
    if (typeof ZIndices !== 'undefined') {
      _applyZ(map);
    } else {
      _zQueue.push(map);
    }
  };

  // ================================================================
  //  addLayers —— 注入新图层 { name: {srcfn,showfn,zfn,animation} }
  //  在 :storyinit 统一注入，自动去重
  // ================================================================

  var _layerQueue = [];

  function _injectLayers(layers) {
    var model;
    try { model = Renderer.CanvasModels && Renderer.CanvasModels.main; } catch (e) { return; }
    if (!model || !model.layers) return;

    var keys = Object.keys(layers);
    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      if (model.layers[name]) continue;
      model.layers[name] = layers[name];
    }
  }

  SR.addLayers = function (layers) {
    if (_flushed) { _injectLayers(layers); } else { _layerQueue.push(layers); }
  };

  // ================================================================
  //  patchLayer / patchLayers —— 修改已有图层属性（不改名）
  //  patchLayer("rightarm", fn) 或 patchLayers(filterFn, fn)
  //  自动排队 + 去重（同名只 patch 一次）
  // ================================================================

  var _patchedNames = {};
  var _patchQueue = [];

  function _applyPatch(name, patchFn) {
    if (_patchedNames[name]) return; // 去重
    var model;
    try { model = Renderer.CanvasModels && Renderer.CanvasModels.main; } catch (e) { return; }
    if (!model || !model.layers || !model.layers[name]) return;
    patchFn(model.layers[name], name);
    _patchedNames[name] = true;
  }

  function _applyPatchAll(filterFn, patchFn) {
    var model;
    try { model = Renderer.CanvasModels && Renderer.CanvasModels.main; } catch (e) { return; }
    if (!model || !model.layers) return;

    var keys = Object.keys(model.layers);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (_patchedNames[k]) continue;
      if (!filterFn(k, model.layers[k])) continue;
      patchFn(model.layers[k], k);
      _patchedNames[k] = true;
    }
  }

  // 修改单个命名图层
  SR.patchLayer = function (name, patchFn) {
    if (typeof patchFn !== 'function') return;
    if (_flushed) { _applyPatch(name, patchFn); } else { _patchQueue.push({ name: name, fn: patchFn }); }
  };

  // 按过滤函数批量修改（如匹配所有右臂相关图层）
  SR.patchLayers = function (filterFn, patchFn) {
    if (typeof patchFn !== 'function' || typeof filterFn !== 'function') return;
    if (_flushed) { _applyPatchAll(filterFn, patchFn); } else { _patchQueue.push({ filter: filterFn, fn: patchFn }); }
  };

  // ================================================================
  //  onCompile —— 注册 compile 钩子
  //  hook(layerSpecs, options, model)，返回修改后的 layerSpecs
  //  多个钩子按注册顺序执行。任一个返回 null/undefined 则保留原样。
  // ================================================================

  var _compileHooks = [];

  SR.onCompile = function (hook) {
    _compileHooks.push(hook);
  };

  function _setupCompileHook() {
    if (typeof CanvasModel === 'undefined') return;
    if (CanvasModel.prototype._susatoCompileHooked) return;

    var _originalCompile = CanvasModel.prototype.compile;

    CanvasModel.prototype.compile = function (options) {
      var specs = _originalCompile.call(this, options);

      for (var i = 0; i < _compileHooks.length; i++) {
        try {
          var result = _compileHooks[i](specs, options, this);
          if (result) specs = result;
        } catch (e) {}
      }

      return specs;
    };

    CanvasModel.prototype._susatoCompileHooked = true;
  }

  // 提早安装 compile 包装器 —— 和"能用的直接覆写"同时机：加载时就装，不等 :storyinit。
  // DoL 的 Renderer 可能在 :storyinit 之前/之时就捕获 compile，迟到的包装器不生效。
  // 包装器按引用读 _compileHooks，稍后（如 clothing-layering 加载时）注册的钩子也能被读到。
  (function _earlyCompileHook() {
    if (typeof CanvasModel !== 'undefined') { _setupCompileHook(); return; }
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (typeof CanvasModel !== 'undefined') { _setupCompileHook(); clearInterval(t); return; }
      if (n > 200) clearInterval(t);
    }, 25);
  })();

  // ================================================================
  //  统一注入时机：:storyinit 一次性处理所有排队 + 挂载 compile 钩子
  // ================================================================

  var _flushed = false;

  function _flush() {
    // ZIndices
    for (var i = 0; i < _zQueue.length; i++) { _applyZ(_zQueue[i]); }
    _zQueue = [];

    // 新增图层
    for (var i = 0; i < _layerQueue.length; i++) { _injectLayers(_layerQueue[i]); }
    _layerQueue = [];

    // 修改已有图层
    for (var i = 0; i < _patchQueue.length; i++) {
      var p = _patchQueue[i];
      if (p.name) { _applyPatch(p.name, p.fn); } else { _applyPatchAll(p.filter, p.fn); }
    }
    _patchQueue = [];

    // compile 钩子：在所有图层就绪后挂载
    _setupCompileHook();

    _flushed = true;

    // 切换为直接执行模式
    SR.addLayers = function (layers) { _injectLayers(layers); };
    SR.extendZIndices = function (map) { _applyZ(map); };
    SR.patchLayer = function (name, fn) { _applyPatch(name, fn); };
    SR.patchLayers = function (filter, fn) { _applyPatchAll(filter, fn); };
  }

  // ================================================================
  //  UI：侧边栏 off-canvas 面板（通用）
  //
  //  触发按钮由 boot.json 的 TweeReplacer 注入 StoryCaption 源码
  //  （Story = Object.freeze，运行时注不进去，只能改 passage 源码）。
  //  两种触发方式：
  //    1) <<button ...>><<run SusatoModel.ui.openPanel('某widget')>><</button>>
  //    2) 注入 <div data-susato-panel="某widget" ...>标签</div>（零额外 JS，
  //       由下方文档级委托接管，扛住 StoryCaption 每回合重渲染）
  //  面板挂在 document.body 上（在 #story-caption 之外，不被侧边栏刷新冲掉）。
  // ================================================================

  var SU = window.SusatoModel.ui = window.SusatoModel.ui || {};

  var PANEL_ID = 'susato-panel';

  SU.closePanel = function () {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.parentNode && panel.parentNode.removeChild(panel);
  };

  // 打开/切换一个渲染 <<widgetName>> 的 off-canvas 面板。
  // opts.width 可选（默认 400px）。再点同一触发 = 关闭；点别的 = 换内容。
  SU.openPanel = function (widgetName, opts) {
    opts = opts || {};
    var existing = document.getElementById(PANEL_ID);
    if (existing) {
      var same = existing.getAttribute('data-widget') === widgetName;
      SU.closePanel();
      if (same) return; // toggle 关闭
    }

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('data-widget', widgetName);
    var width = opts.width || 400;
    panel.style.cssText =
      'position:fixed;top:0;right:0;width:' + width + 'px;max-width:100vw;height:100vh;' +
      'overflow-y:auto;background:#1a1a2e;border-left:2px solid #555;z-index:9999;' +
      'padding:16px;color:#ccc;box-shadow:-4px 0 20px rgba(0,0,0,0.5);';

    var closeBtn = document.createElement('span');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText =
      'position:sticky;top:0;float:right;cursor:pointer;font-size:18px;color:#c44;z-index:1;';
    closeBtn.onclick = SU.closePanel;
    panel.appendChild(closeBtn);

    var content = document.createElement('div');
    content.style.clear = 'both';
    panel.appendChild(content);

    document.body.appendChild(panel);

    // 正确渲染 widget 到目标元素：用 jQuery.wiki（wikifyEval 不接收目标元素）
    try {
      if (typeof $ !== 'undefined') { $(content).wiki('<<' + widgetName + '>>'); }
      else { new Wikifier(content, '<<' + widgetName + '>>'); }
    } catch (e) {}
  };

  // 向后兼容：deco 面板
  SU.closeDecoPanel = SU.closePanel;
  SU.openDecoPanel = function () { SU.openPanel('decoPanel'); };

  // 文档级事件委托：任何带 data-susato-panel="widget" 的元素点击/回车都触发对应面板。
  // 绑在 document 上，扛住 StoryCaption 每回合重渲染。兼容旧的 #susato-deco-btn。
  function _bindClicks() {
    if (typeof $ === 'undefined') return;
    if (SU._panelClickBound) return;
    SU._panelClickBound = true;

    function widgetOf(el) {
      var w = el.getAttribute && el.getAttribute('data-susato-panel');
      if (w) return w;
      if (el.id === 'susato-deco-btn') return 'decoPanel'; // 兼容旧触发
      return null;
    }
    $(document).on('click', '[data-susato-panel], #susato-deco-btn', function (ev) {
      var w = widgetOf(this); if (!w) return;
      ev.preventDefault(); SU.openPanel(w);
    });
    $(document).on('keydown', '[data-susato-panel], #susato-deco-btn', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var w = widgetOf(this); if (!w) return;
      ev.preventDefault(); SU.openPanel(w);
    });
  }

  if (typeof $ !== 'undefined') {
    _bindClicks();
    $(document).one(':storyinit', _bindClicks);
  }

  if (typeof $ !== 'undefined') {
    $(document).one(':storyinit', _flush);
  } else {
    var _attempts = 0;
    var _t = setInterval(function () {
      _attempts++;
      if (typeof $ !== 'undefined') {
        clearInterval(_t);
        $(document).one(':storyinit', _flush);
      } else if (_attempts > 200) { // 10s timeout
        clearInterval(_t);
      }
    }, 50);
  }
})();
