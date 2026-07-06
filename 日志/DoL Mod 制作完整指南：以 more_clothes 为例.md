# DoL Mod 制作完整指南：以 more_clothes 为例

## 适用场景

当你需要制作一个**添加新服装/新发型/新转化部件**的 Degrees of Lewdity Mod 时参考。more_clothes (v0.2.4) 是目前最完整的「内容添加型 mod」范本。

---

## 一、Mod 整体架构

### 1.1 目录结构

```
more_clothes/
├── boot.json              # 核心配置：资源清单 + 插件声明 + 依赖
├── code/
│   ├── addon-clothes/     # 服装数据定义（按槽位分文件）
│   │   ├── upper.json     # 上衣
│   │   ├── lower.json     # 下装
│   │   ├── over_upper.json
│   │   ├── over_lower.json
│   │   ├── under_lower.json
│   │   ├── feet.json
│   │   ├── legs.json
│   │   ├── head.json
│   │   ├── face.json
│   │   ├── neck.json
│   │   └── handheld.json
│   ├── addon-hair/
│   │   └── hair.json      # 发型数据定义
│   └── addon-TF/          # 转化部件 Twee 补丁
│       ├── ears.txt
│       ├── cheeks.txt
│       └── tail.txt
├── img/                   # 286 张 PNG 图片
│   ├── body/              # 身体基础图片（8 张）
│   ├── clothes/           # 服装图片（按槽位/物品组织）
│   ├── hair/fringe/       # 前发图片（按发型/长度分）
│   ├── hair/sides/        # 侧发图片
│   ├── misc/icon/clothes/ # 服装图标（商店用）
│   └── transformations/   # 转化部件图片
├── img/credit/            # 致谢图
├── img/preview/           # 预览图
└── Readme.txt
```

### 1.2 核心概念：内容模组 vs 补丁模组

| 类型 | 功能 | 使用的 Addon |
|------|------|-------------|
| **内容添加** | 添加全新服装/发型/转化 | `ModdedClothesAddon`, `ModdedHairAddon`, `ImageLoaderAddon` |
| **Twee 补丁** | 修改现有 Twee 段落（如添加选项） | `TweeReplacer` |
| **JS 补丁** | 修改游戏 JS 逻辑 | `ReplacePatcher` |

more_clothes 同时使用了前两种。

---

## 二、boot.json 完整解析

### 2.1 顶部元数据 + 文件清单

```json
{
  "name": "more clothes for susato",
  "version": "0.2.4",
  "styleFileList": [],
  "scriptFileList": [],
  "tweeFileList": [],
  "additionFile": [           // 需要加载的代码/数据文件
    "code/addon-TF/ears.txt",
    "code/addon-TF/cheeks.txt",
    "code/addon-TF/tail.txt",
    "code/addon-hair/hair.json",
    "Readme.txt"
  ],
  "imgFileList": [ ... ],     // 286 张 PNG（逐一列出）
  "additionDir": [],
  ...
}
```

### 2.2 addonPlugin — 四大插件协同

```json
"addonPlugin": [
  {
    // ① 服装添加器 — 注册新服装数据
    "modName": "ModdedClothesAddon",
    "addonName": "ModdedClothesAddon",
    "modVersion": "^1.1.0",
    "params": {
      "clothes": [
        { "key": "feet",    "filePath": "code/addon-clothes/feet.json" },
        { "key": "legs",    "filePath": "code/addon-clothes/legs.json" },
        { "key": "head",    "filePath": "code/addon-clothes/head.json" },
        { "key": "face",    "filePath": "code/addon-clothes/face.json" },
        { "key": "neck",    "filePath": "code/addon-clothes/neck.json" },
        { "key": "upper",   "filePath": "code/addon-clothes/upper.json" },
        { "key": "lower",   "filePath": "code/addon-clothes/lower.json" },
        { "key": "over_upper",  "filePath": "code/addon-clothes/over_upper.json" },
        { "key": "over_lower",  "filePath": "code/addon-clothes/over_lower.json" },
        { "key": "under_lower", "filePath": "code/addon-clothes/under_lower.json" },
        { "key": "handheld","filePath": "code/addon-clothes/handheld.json" }
      ]
    }
  },
  {
    // ② Twee 替换器 — 修改现有 Twee 段落
    "modName": "TweeReplacer",
    "addonName": "TweeReplacerAddon",
    "modVersion": "1.1.0",
    "params": [
      {
        "passage": "Widgets Mirror",
        "findString": "<<listbox \"_fox.ears\" autoselect>>",
        "replaceFile": "code/addon-TF/ears.txt"
      },
      {
        "passage": "Widgets Mirror",
        "findString": "<<listbox \"_fox.cheeks\" autoselect>>",
        "replaceFile": "code/addon-TF/cheeks.txt"
      },
      {
        "passage": "Widgets Mirror",
        "findString": "<<listbox \"_fox.tail\" autoselect>>",
        "replaceFile": "code/addon-TF/tail.txt"
      }
    ]
  },
  {
    // ③ 发型添加器 — 注册新发型数据
    "modName": "ModdedHairAddon",
    "addonName": "ModdedHairAddon",
    "modVersion": "^1.0.0",
    "params": {
      "hair": ["code/addon-hair/hair.json"]
    }
  },
  {
    // ④ 图片加载器 — 必装的底层依赖
    "modName": "ModLoader DoL ImageLoaderHook",
    "addonName": "ImageLoaderAddon",
    "modVersion": "^2.3.0",
    "params": []
  }
]
```

### 2.3 四大插件的职责

| 插件 | 做什么 | 数据格式 |
|------|--------|---------|
| `ModdedClothesAddon` | 往游戏注册新服装（出现在商店、可穿戴） | JSON 数组，按 `key`（槽位）分文件 |
| `ModdedHairAddon` | 往游戏注册新发型（出现在理发店/镜子） | JSON 对象，含 `fringe[]` + `sides[]` |
| `TweeReplacer` | 在指定 Twee 段落中替换指定字符串 | 文本文件（通常是 Twee 宏代码） |
| `ImageLoaderAddon` | 加载 `imgFileList` 中的图片到游戏 | 无需 params |

### 2.4 依赖声明

```json
"dependenceInfo": [
  { "modName": "ModdedClothesAddon",   "version": "^1.1.0" },
  { "modName": "ModdedHairAddon",      "version": "^1.0.0" },
  { "modName": "ModLoader DoL ImageLoaderHook", "version": "^2.3.0" }
]
```

---

## 三、服装数据 JSON 格式（addon-clothes/*.json）

### 3.1 每个文件的结构

每个 JSON 文件是一个**数组**，包含该槽位的多件服装。每件服装是一个对象。

### 3.2 上衣 (upper) 字段完全解析

```json
{
  "index": 1,                    // 数字序号（自己分配，文件内唯一）
  "name": "angel robe",          // 内部名称（英文，全小写）
  "name_cap": "Angel robe",      // 显示名称（首字母大写）
  "cn_name_cap": "天使长袍",     // 中文名（可选）
  "variable": "angelrobe",       // 变量名（用于代码引用，无空格）
  "integrity_max": 500,          // 最大耐久度
  "integrity": 500,              // 初始耐久度
  "fabric_strength": 100,        // 面料强度（影响破损速度）
  "reveal": 300,                 // 暴露值：越高越暴露
  "bustresize": 0,              // 胸围尺寸偏移（-12=显小，正数=显大）
  "word": "a",                  // 冠词（a/an/n=无冠词）
  "one_piece": 1,               // 是否连体（1=是）
  "strap": 0,                   // 是否有吊带
  "open": 0,                    // 是否敞开（如开衫外套）
  "state_top_base": "chest",    // 破损前的上端位置
  "state_base": "waist",        // 破损前的下端位置
  "state_top": "chest",         // 当前上端位置
  "state": "waist",             // 当前下端位置
  "plural": 0,                  // 是否复数名词（pants 类=1）
  "colour": 0,                  // 是否可染色（0=不可，1=可，主色）
  "colour_options": [],         // 可选颜色列表（空=不可染色）
  "colour_sidebar": 0,          // 侧边栏是否显示颜色
  "colour_combat": 0,           // 战斗中默认颜色
  "exposed_base": 0,            // 基础暴露度
  "exposed": 0,                 // 当前暴露度
  "type": ["formal", "holy"],   // 类型标签（影响 NPC 反应/事件判定）
  "set": "angelrobe",           // 套装名（上下装联动用）
  "gender": "n",                // 性别限制（f/m/n）
  "femininity": 0,             // 女性化程度（0-200）
  "warmth": 50,                // 保暖值
  "cost": 5000,                // 售价（便士）
  "description": "...",        // 商店描述
  "shop": ["clothing", "forest"], // 可购商店
  "accessory": 0,              // 是否有饰品层
  "accessory_colour": 0,       // 饰品是否可染色
  "accessory_colour_options": [],
  "sleeve_img": 1,             // 是否有袖子层
  "breast_img": 1,             // breast_img 模式：0=无胸差，1=有（0-6.png）
  "breast_acc_img": 0,        // 胸部饰品图片
  "has_collar": 0,             // 是否有领子
  "cursed": 0,                 // 是否被诅咒
  "location": 0,               // 特殊位置标记
  "iconFile": "angel_robe.png", // 商店图标文件名
  "accIcon": 0,                // 饰品图标
  "mainImage": 1,              // 是否有主图（full.png 等）
  "outfitPrimary": {           // 连体套装：定义主搭配
    "lower": "angel robe bottom"
  },
  "notuck": 1,                 // 不可塞入下装
  "pregType": 0                // 孕期适配类型
}
```

### 3.3 下装 (lower) 独有字段

| 字段 | 说明 |
|------|------|
| `rearresize` | 臀部尺寸偏移 |
| `skirt` | 是否裙子（1=是） |
| `skirt_down` | 裙子是否下垂 |
| `short` | 是否短裤/短裙 |
| `vagina_exposed_base` / `vagina_exposed` | 阴道暴露度 |
| `anus_exposed_base` / `anus_exposed` | 肛门暴露度 |
| `outfitSecondary` | 反向套装引用：`["upper", "angel robe"]` |

### 3.4 鞋类 (feet) 独有字段

| 字段 | 说明 |
|------|------|
| `plural` | 鞋类通常=1（复数名词） |
| `heels` | 是否高跟鞋（影响 type: `["heels"]`） |

### 3.5 手持物 (handheld) 独有字段

| 字段 | 说明 |
|------|------|
| `mask_img` | 是否有遮罩图 |
| `back_img` | 是否有背面图 |
| `back_img_acc` | 背面饰品图 |
| `back_img_acc_colour` | 背面饰品颜色模式 |
| `shopGroup` | 商店分类组名（如 `"parasols"`） |

### 3.6 关键设计模式

**套装 (outfit) 链接**：
- 上衣通过 `outfitPrimary: { lower: "xxx" }` 指定默认下装
- 下装通过 `outfitSecondary: ["upper", "xxx"]` 反向绑定上衣
- 同 `set` 值的上下装自动关联成套

**图标引用**：
- `iconFile` 指向 `img/misc/icon/clothes/` 下的文件
- 没有图标时设为 `0`

**商店数组 shop**：
- `"clothing"` = 普通服装店
- `"forest"` = Forest Shop
- `"school"` = 学校商店
- `"adult"` = 成人商店
- `"mirrorhair"` = 镜子/理发店（仅发型用）

---

## 四、发型数据 JSON 格式（addon-hair/hair.json）

```json
{
  "fringe": [
    {
      "name": "Bob hair",        // 内部名
      "name_cap": "波波头",      // 显示名
      "variable": "Bob hair",    // 变量名
      "type": ["loose"],         // 发型类型标签
      "shop": ["mirrorhair"]     // 出现的商店
    },
    // ...更多前发
  ],
  "sides": [
    {
      "name": "Sai",
      "name_cap": "塞妹",
      "variable": "Sai",
      "type": ["short"],
      "shop": ["mirrorhair"]
    },
    // ...更多侧发
  ]
}
```

### 图片命名约定

前发：`img/hair/fringe/{发型名}/{长度}.png`（长度：short/shoulder/chest/navel/thighs/feet）
侧发：`img/hair/sides/{发型名}/{长度}.png`

---

## 五、TweeReplacer — Twee 内容替换

### 5.1 工作机制

在指定 passage 中找到 `findString`，将其**替换为** `replaceFile` 的文件内容。

### 5.2 本 mod 的实际案例

**目标**：为狐系转化部件在镜子界面增加两个新选项（耳廓狐、九尾狐）。

**原始 Twee 代码**（在 `Widgets Mirror` 段落中）：
```
<<listbox "_fox.ears" autoselect>>
```

**替换后**（`ears.txt` 的内容）：
```
<<listbox "_fox.ears" autoselect>>
<<option "耳廓狐" "fennec">>
<<option "九尾狐" "ninetailedfox">>
```

游戏中原本的 options 由游戏代码动态生成，TweeReplacer 在 `listbox` 标签后**追加**了新的选项。

### 5.3 TweeReplacer vs ReplacePatcher

| 特性 | TweeReplacer | ReplacePatcher |
|------|-------------|----------------|
| 粒度 | 替换单个字符串 | 替换精确匹配的代码块 |
| 目标 | Twee passage | JS 文件 或 Twee passage |
| 内容来源 | 外部文件 (`replaceFile`) | 内联 JSON 字符串 |
| 适用场景 | 添加选项、修改 widget | 修改底层逻辑 |
| 查找方式 | `passage` + `findString` | `fileName` 或 `passageName` + `from` |

---

## 六、imgFileList 管理

### 6.1 组织规范

图片路径镜像了 DoL 原生结构：
```
img/clothes/{slot}/{item_name}/
├── full.png         # 完整/基础
├── frayed.png       # 磨损
├── torn.png         # 撕裂
├── tattered.png     # 破洞
├── left.png         # 左半身（侧面视角）
├── right.png        # 右半身
├── left_cover.png   # 左半身遮罩
├── right_cover.png  # 右半身遮罩
├── hold.png         # 手遮胸姿态
├── 0.png ~ 6.png    # 胸围尺寸变体
├── acc.png          # 饰品层
└── *_gray.png       # 灰度版（染色用）
```

### 6.2 本 mod 图片统计

| 类别 | 数量 | 示例 |
|------|------|------|
| body/ | 8 | basehead, basenoarms, rightarmidle (a/f/m 体型) |
| upper/ | ~78 | angelrobe, breeze, brokenstraitjacket, mess, pinkydress, Ri, richang, Sai, satsuki, vine, beanstalk |
| lower/ | ~60 | 对应上装的底部 + 独立下装 (chequerskirtmi, fibonaccishorts, angelshorts, sleepyshorts) |
| over_upper/ | ~8 | breeze 外套 |
| over_lower/ | ~4 | breeze 外套下摆 |
| under_lower/ | ~5 | plasterunderwear（含 gray 变体） |
| feet/ | ~6 | clogs, geta, mess, Sai |
| head/ | ~2 | Sai, mess |
| legs/ | ~1 | Sai |
| face/ | ~4 | littleblackface |
| neck/ | ~1 | mess |
| handheld/ | ~10 | baseballbat, card, dumbbell, seethroughumbrella |
| hair/fringe/ | 24 | Bob hair, Ri, Sai, Shen (×6 长度) |
| hair/sides/ | 18 | Ri, Sai, Shen (×6 长度) |
| icon/clothes/ | ~25 | 商店图标 |
| transformations/fox/ | 6 | cheeks/ears/tail × fennec/ninetailedfox |
| credit/preview | 5 | 预览图 |

**总计：286 张 PNG**

---

## 七、制作新服装 mod 的标准流程

### Step 1: 准备图片

1. 在 `img/clothes/{slot}/{item_name}/` 下放置至少 `full.png`
2. 可选：frayed/torn/tattered/left/right/hold/0-6/acc 变体
3. 在 `img/misc/icon/clothes/` 放置商店图标

### Step 2: 编写服装数据

在 `code/addon-clothes/{slot}.json` 中按现有格式添加条目：
- `index` 递增
- `name` 用小写英文
- `variable` 不含空格
- `iconFile` 指向图标名
- `shop` 至少含一个商店
- 上下装套装需配 `set` 和 `outfitPrimary`/`outfitSecondary`

### Step 3: 更新 boot.json

1. `imgFileList` 中添加所有新图片路径
2. 如果是新槽位文件，在 `ModdedClothesAddon.params.clothes` 中添加条目
3. 版本号递增

### Step 4: 验证

```bash
# 1. JSON 语法检查
for f in code/addon-clothes/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('$f: OK')"
done

# 2. boot.json 校验
node -e "JSON.parse(require('fs').readFileSync('boot.json','utf8')); console.log('OK')"

# 3. 图片存在性检查（boot.json 中列出的每张图片都必须在磁盘上）
```

---

## 八、冲突处理（合并到 susato-model 主 mod 时）

当子 mod 的图片/数据与主 mod 冲突时：

1. **图片冲突** → 加 `extre-` 前缀重命名，同步改 JSON 引用
2. **JSON 引用更新** → `iconFile` / `accIcon` 字段改为新文件名
3. **同名服装变量** → 检查 `variable` 是否重复，必要时改名

具体案例见 `Susato-Model Boot 系统完整指南.md` 第九节。

---

## 九、关键教训

1. **四大插件缺一不可**：`ModdedClothesAddon` + `ModdedHairAddon` + `ImageLoaderAddon` + `TweeReplacer`（如有需要）
2. **boot.json 字段必须齐全**：参考 [[DoL Special Clothes 解锁系统与 Mod 制作]] 的字段清单
3. **`imgFileList` 必须枚举每张图片**：不能用 glob，必须逐条列出（286 张 = 286 行）
4. **图片路径与 JSON 数据必须一致**：`iconFile` 名 vs 实际文件名必须匹配
5. **TweeReplacer 的 `findString` 必须精确**：在目标 passage 中有且仅有一处匹配
6. **content-type mod 与 code-patch mod 的结构完全不同**：不要混用模板

---

## 十、Bug：缺少 left-idle.png / right-idle.png 导致图片加载失败

### 现象

```
Failed to load image img/clothes/upper/Ri/right-idle.png for layer upper_rightarm
Failed to load image img/clothes/upper/Ri/left-idle.png for layer upper_leftarm
```

### 根因

DoL 的服装渲染器在角色处于 **idle（休闲）姿态** 时，会查找 `{side}-idle.png` 变体文件。more_clothes 中所有有侧视图（`left.png` / `right.png`）的上衣都缺少 `-idle` 变体。

这是因为 `leftImage: 1` / `rightImage: 1` 告诉渲染器该服装有侧面手臂层，渲染器在 idle 状态下会按命名约定查找 `left-idle.png` 和 `right-idle.png`。

### 影响范围

more_clothes 中 **10 个上衣** 全部缺少 `-idle` 文件：angelrobe, beanstalk, breeze, brokenstraitjacket, mess, Ri, richang, Sai, satsuki, vine。

### 修复

```bash
# 对每个受影响的上衣，复制 left.png → left-idle.png, right.png → right-idle.png
# 并在 boot.json imgFileList 中注册新文件
```

修复后新增 20 张图片（10 件 × 2 方向），boot.json 从 286 → 307 条目。

### 预防

制作新上衣 mod 时，如果服装数据中设置了 `leftImage: 1` / `rightImage: 1`，必须同时提供以下全套侧面图片：

| 文件 | 用途 |
|------|------|
| `left.png` / `right.png` | 标准侧面手臂层 |
| `left_cover.png` / `right_cover.png` | 侧面遮罩（如有） |
| **`left-idle.png` / `right-idle.png`** | **idle 姿态侧面手臂层** ← 容易遗漏！ |
| `left-idle-acc.png` / `right-idle-acc.png` | idle 饰品层（如有） |

---

## 十一、Bug：图标文件命名三方不一致导致 misc icon 无法显示

### 现象

商店中部分服装的图标无法显示（显示为破图/空白）。

### 根因

mod 中存在**三种命名体系**互相不一致：

| 层级 | 命名惯例 | 示例 |
|------|---------|------|
| **磁盘文件名** | 连写 或 短横线 | `angelrobe.png`, `little-black-face.png` |
| **boot.json 注册名** | 下划线分隔 | `angel_robe.png`, `little_black_face.png` |
| **JSON iconFile 引用** | 混用两种风格 | 有的跟磁盘，有的跟 boot.json |

游戏加载流程：`JSON iconFile` → 告诉渲染器找哪个文件 → `boot.json` 注册该文件名 → `磁盘` 提供实际文件。三者必须一致。

### 影响范围

- **19 个图标**磁盘文件名与 boot.json 不一致
- **14 个 JSON 引用**指向错误文件名
- **2 个套装下装图标**完全缺失（`broken_straitjacket_bottom.png`, `angel_robe_bottom.png`）
- **2 个雨伞图标引用**指向不存在的文件（`umbrella.png`, `umbrella_acc.png`）

### 修复策略

以 **boot.json 为唯一标准**（因为它是最难批量修改的，需要逐行列出）：

1. 重命名磁盘文件名 → 对齐 boot.json（19个）
2. 更新 JSON iconFile/accIcon → 对齐 boot.json（14个）
3. 缺失图标 → 复制上装图标作为下装图标 + 注册到 boot.json（2个）
4. 雨伞图标 → `iconFile: 0`（无可用图标资源）
5. boot.json 重新排序

### 预防

制作新服装 mod 时，遵循**单一命名约定**：

```
规则：所有 icon 文件名统一使用 下划线 `_` 作为分隔符
示例：angel_robe.png, broken_straitjacket.png, mess_feet_icon.png

一致性检查脚本：
1. 磁盘文件列表 = boot.json imgFileList 中 icon 条目
2. 每个 JSON iconFile 值 ∈ boot.json imgFileList
```
