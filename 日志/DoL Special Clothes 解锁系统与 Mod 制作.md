# DoL Special Clothes 解锁系统与 Mod 制作

## 适用场景

当需要制作修改 Special Clothes（Forest Shop 特殊服装）解锁逻辑的 mod 时参考。

---

## 一、Special Clothes 系统架构

### 1.1 核心文件

所有核心逻辑位于 `game/base-clothing/clothing-special.js`（编译后在 HTML 中为 `/* twine-user-script #194`）。

### 1.2 三大核心函数

| 函数 | 作用 | 调用时机 |
|------|------|---------|
| `initSpecialClothes()` | 定义所有特殊服装的物品→套装映射 和 套装元数据 | 游戏初始化 |
| `specialClothesUpdate()` | 初始化/维护 `V.specialClothes` 数组，所有物品 `unlocked: 0` | start2、版本更新 |
| `specialClothesRefresh()` | 检查条件，将符合条件的 `unlocked` 升级到 3 | 进入 Forest Shop、版本更新、in-passage 解锁 |

### 1.3 解锁等级体系

```
0: locked（未解锁）
1: 作弊解锁（未满足真实条件）
2: feat booster 解锁（未满足真实条件，但计入 Gwylan 好感度）
3: 满足条件解锁 / 事件触发解锁（可与 Gwylan 交谈，提供更多好感度）
```

### 1.4 数据流

```
游戏初始化
  → clothingDataInit()  [init.js #198]
    → initSpecialClothes()  [clothing-special.js #194]
      → 构建 setup.specialClothes[]（每件物品的 name + sets）
      → 构建 setup.specialClothesSets{}（每个套装的 requirements/hint/shop/feat）
  → specialClothesUpdate()
      → 初始化 V.specialClothes = [{ name: "witch dress", unlocked: 0 }, ...]

进入 Forest Shop
  → Forest Shop Entrance passage
    → <<specialClothesRefresh>>
      → specialClothesRefresh()
        → 遍历 V.specialClothes，检查每个物品的 requirements
        → 满足条件 → unlocked = 3
```

---

## 二、JS 函数补丁（JS Patching）方法

### 2.1 ReplacePatcher 机制

ModLoader 的 `ReplacePatcher` 可以对游戏编译后的 JS 文件做精确文本替换。每条补丁包含：

| 字段 | 说明 |
|------|------|
| `fileName` | 目标 JS 文件名（如 `clothing-special.js`） |
| `from` | 原始代码（精确匹配，必须逐字符一致） |
| `to` | 替换后的代码 |

### 2.2 定位 fileName

在 HTML 源码中搜索 `twine-user-script` 注释找到目标文件：

```
/* twine-user-script #194: "game\\base-clothing\\clothing-special.js" */
```

`fileName` 取路径的最后一段：`clothing-special.js`

### 2.3 提取精确 from 字符串

**关键教训**：

1. DoL 代码使用 **Tab 缩进**（不是空格），`from` 字符串中必须使用真实的 `\t`
2. **不要手写** `from` 字符串 — 用 `JSON.stringify()` 或脚本提取
3. 锚点必须唯一且包含上下文以确保精确匹配

**提取脚本模板**：

```js
const fs = require('fs');
const html = fs.readFileSync('Degrees of Lewdity.html', 'utf8');

// 1. 定位 JS 文件
const marker = '/* twine-user-script #194: "game\\\\base-clothing\\\\clothing-special.js" */';
const start = html.indexOf(marker);
const next = html.indexOf('/* twine-user-script #', start + 1);
const script = html.substring(start, next);

// 2. 定位目标函数
const funcStart = script.indexOf('function specialClothesRefresh() {');
const openBrace = script.indexOf('{', funcStart) + 1;

// 3. 搜索精确标记（注意 Tab 数量）
const blockStart = script.indexOf('\t// For any clothes with unlock value', openBrace);

// 4. 定位结束标记
const afterBlock = script.indexOf('\n\n\tif (getUnlockedSpecialSets()', blockStart);
const temp = script.substring(0, afterBlock);
const blockEnd = temp.lastIndexOf('\t\t});') + '\t\t});'.length;

// 5. 提取并验证
const fromBlock = script.substring(blockStart, blockEnd);
console.log('Found:', script.indexOf(fromBlock) !== -1);
fs.writeFileSync('from_string.txt', JSON.stringify(fromBlock));
```

### 2.4 boot.json 完整结构

**重要**：ModLoader 对 boot.json 有严格的格式要求，缺少任何必需字段都会报「无效」错误。

```json
{
  "name": "Mod 名称",
  "version": "1.0.0",
  "author": ":P",
  "description": "Mod 说明",
  "styleFileList": [],
  "scriptFileList": [],
  "tweeFileList": [],
  "imgFileList": [],
  "additionFile": [],
  "additionDir": [],
  "addonPlugin": [
    {
      "modName": "ReplacePatcher",
      "addonName": "ReplacePatcherAddon",
      "modVersion": "1.0.0",
      "params": {
        "js": [
          {
            "_comment1": "描述 v版本 日期 :P",
            "fileName": "clothing-special.js",
            "from": "<JSON.stringify 的输出（不含外层引号）>",
            "to": "<替换后的代码>"
          }
        ],
        "twee": [],
        "css": []
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "ReplacePatcher",
      "version": "^1.0.0"
    }
  ]
}
```

**必需字段清单**（少了任何一个都会报无效）：

| 层级 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 根 | `name` | string | Mod 名称 |
| 根 | `version` | string | 版本号（建议 `x.y.z` 格式） |
| 根 | `author` | string | 作者标识 |
| 根 | `description` | string | 说明文字 |
| 根 | `styleFileList` | array | CSS 文件列表（无则 `[]`） |
| 根 | `scriptFileList` | array | JS 文件列表（无则 `[]`） |
| 根 | `tweeFileList` | array | Twee 文件列表（无则 `[]`） |
| 根 | `imgFileList` | array | 图片文件列表（无则 `[]`） |
| 根 | `additionFile` | array | 附加文件列表（无则 `[]`） |
| 根 | `additionDir` | array | 附加目录列表（无则 `[]`） |
| 根 | `dependenceInfo` | array | 依赖声明（至少包含 ReplacePatcher） |
| addonPlugin | `modName` | string | `"ReplacePatcher"` |
| addonPlugin | `addonName` | string | `"ReplacePatcherAddon"` |
| addonPlugin | `modVersion` | string | 版本号 |
| params | `js` | array | JS 补丁列表（无则 `[]`） |
| params | `twee` | array | Twee 补丁列表（无则 `[]`） |
| params | `css` | array | CSS 补丁列表（无则 `[]`） |

> **教训**：不能只参考 susato-model 主 boot.json（它还有 `imgFileList` 条目和 `ModdedClothesAddon` 等），纯代码补丁 mod 应参考 `理发店回退补丁/boot.json` 的格式。

### 2.5 验证步骤

```bash
# 1. JSON 语法检查
node -e "JSON.parse(require('fs').readFileSync('boot.json','utf8')); console.log('OK')"

# 2. from 字符串匹配验证
node -e "
const html = require('fs').readFileSync('Degrees of Lewdity.html','utf8');
const boot = JSON.parse(require('fs').readFileSync('boot.json','utf8'));
const patch = boot.addonPlugin[0].params.js[0];
// 在对应 JS 文件中搜索
const marker = '/* twine-user-script #194';
const start = html.indexOf(marker);
const next = html.indexOf('/* twine-user-script #', start + 1);
const script = html.substring(start, next);
console.log('Match:', script.indexOf(patch.from) !== -1 ? 'YES' : 'NO');
"
```

---

## 三、Forest Shop 完整架构

### 3.1 渲染系统

两个 location 对象控制背景：

| Location | 文件夹 | 特色 |
|----------|--------|------|
| `forest_shop` | `forest-shop/` | 四季前后景 + 烟雾动画 + 灯光 emissive + 雨/雾天气 |
| `forest_shop_garden` | `forest-shop-garden/` | 基础/雪景 + 烟雾 + 蓝色萤火虫 emissive |

### 3.2 入口事件链（`Forest Shop Entrance`）

优先级从高到低：
1. `forest_shop_intro !== 1` → Forest Shop Intro
2. `_gwylanStatus.includes("reunion")` → Forest Shop Reunion
3. `_gwylanStatus.includes("aurigaScarConfront")` → Forest Shop Nowhere
4. `dissociation >= 1` → Forest Shop Trauma
5. `gwylanSteal` → Forest Shop Thief
6. 好感度 ≥10% → Forest Shop Intruder
7. 好感度 ≥85% + devotion → Forest Shop Familiar Collar
8. Whitney 使魔 → Forest Shop Familiar Whitney
9. 随机高潮 → Forest Shop Mystery Orgasm
10. 默认 → 主商店界面

### 3.3 商店界面结构

`Forest Shop Widgets` passage 中的 `forestShop-main` widget：
- 所有标准服装槽位（outfit/upper/lower/under_upper/under_lower/head/face/neck/handheld/hands/legs/feet）
- 每个槽位有独特的"位置描述"（如 "Look in the antique wardrobe"）
- 支持：试穿、购买、购买并送衣柜、偷窃
- 条件性解锁 Sex Toys 分类

### 3.4 Gwylan NPC 日程

| 时间 | 位置 |
|------|------|
| 5:00–6:45 | garden（花园） |
| 7:00–9:20 | cafe / cliff（咖啡馆/悬崖） |
| 23:00–5:00 | sleep（睡眠） |
| 其他 | shop（在店） |

好感度公式：`love = 已解锁套装数 + 已谈论套装数`（仅计算 `shop: ["forest"]` 的套装）

---

## 四、Special Clothes 全部套装清单

### 节日套装
**halloween**：witch, vampire, mummy, scarecrow, skeleton, future_suit, pumpkin
**christmas**：（所有圣诞服装）
**valentines**：rose_wedding, wrap

### Bad End 套装
underground_brothel, underground_farm, loincloth, bird, prison, asylum

### Temple 套装（同时在 Temple Shop 出售）
temple_initiate, temple_monk_and_nun, temple_evangelist, temple_confessor, temple_exorcist, temple_sparring, temple_sexy, holy_stole

### 吊坠
holy_pendant, stone_pendant, dark_pendant

### 历史套装
museum_rags, vintage, chain_tunic

### 特殊事件
foreign_school, brothel, chef, hookah, islander, fox_mask, fedora, catsuit, janet, dance_studio, shrine, jasper, butterfly, succubus

### 杂项
sage_witch_hat, familiar_collar, flowers

### 仅用于交谈（无独立服装）
transformation, mask, fox

---

## 五、2026-07-06：Unlock All Special Clothes Mod 制作记录

### 方案选择

选择了 **JS 补丁修改 `specialClothesRefresh()`** 而非以下替代方案：

| 方案 | 放弃原因 |
|------|---------|
| 修改 `specialClothesUpdate` 初始化 unlock=3 | 只对新档有效，旧档已初始化的物品不受影响 |
| Twee 补丁添加大量 `<<specialClothesUnlock>>` 调用 | 需要列举 50+ 套装名，冗长且容易遗漏 |
| 修改 `initSpecialClothes` | 改动过大（整个 41KB 文件），容易因游戏更新而失效 |

**最终方案**：替换 `specialClothesRefresh` 内部的条件检查逻辑块（637字符）→ 无条件遍历赋值（123字符），对新建和已有存档均立即生效。

### 关键发现

1. `specialClothesRefresh` 在每次进入 Forest Shop 时都会调用 → 补丁效果即时
2. `getUnlockedSpecialSets()` 的逻辑依赖于 `unlocked >= 3` → 设置所有为 3 即可
3. Gwylan 好感度和 `Curious Attire`/`Wicked Wardrobe` feat 基于 `getUnlockedSpecialSets()` → 自动获得
4. Tab vs Space：DoL 代码使用 Tab 缩进，`from` 字符串必须逐字节精确匹配

### Bug：boot.json 无效

初次生成的 boot.json 缺少 ModLoader 所需的多个必需字段（`author`、`description`、`additionFile`、`additionDir`、`addonName`、`modVersion`、`params.css`、`dependenceInfo`），导致加载时报「boot.json无效」。

**教训**：纯代码补丁 mod 的 boot.json 格式应参考 `理发店回退补丁/boot.json`，而非 susato-model 主 boot.json（后者是图像资源 mod，字段用途不同）。所有空数组必须显式写为 `[]`，不能省略。
