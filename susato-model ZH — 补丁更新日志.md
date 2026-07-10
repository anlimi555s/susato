# susato-model ZH — 补丁更新日志

## 2026-07-10

### 精简补丁：178 → 30

用 **1 个运行时遍历** 替代 **148 个文本匹配 breast_img 补丁**。

### 运行时补丁（`init.js`）

在所有衣服初始化完后自动执行，遍历 `upper`、`under_upper`、`over_upper` 三个槽位：

| 名单 | 效果 |
|------|------|
| `_keepOriginal`（8件） | 跳过不改，保持游戏原值 |
| `_hideBreasts`（30件） | 禁胸差 + 身体乳房强制平板 |
| 其余 | 自动修复 breast_img 坏模式 |

### 渲染联动（`canvasmodel-main.js`）

检测 `breast_img === 0` → 显示平板胸部，与运行时 `_hideBreasts` 配合。

### 子 mod 兼容提醒

- 渲染补丁改动了 `canvasmodel-main.js` 的 breasts `srcfn`，如果子 mod 也改同一位置，from 字符串可能匹配失败
- 数据补丁在 `init.js` 末尾注入，通常不影响子 mod

### 店内人模

- 女性人模胸围默认使用最大值（5），方便预览胸差效果
- 不受玩家实际胸围影响

### 商店镜像

- decorations 面板双入口支持，兼容 ModI18N 汉化

### 修复项

- 27 件缺胸差图的衣服已补充或加入名单
- `schoolshirt` 下划线命名修正
- `bodywriting/text/` 下划线统一为横线

### 已知缺口

- `upper/towellarge` 缺 6 号胸差图
- `img/face/default/gloomy/makeup/` 命名错误（`eyeshadows`、双扩展名）
