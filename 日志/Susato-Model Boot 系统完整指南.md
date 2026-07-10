# Susato-Model Boot 系统完整指南

## 项目概述

**susato-model ZH** 是一个 Degrees of Lewdity (DoL) 游戏的图像模组 (v2.0)。

### 目录结构

```
susato-model-v5.10-0.7/
├── boot.json          # 核心配置文件（资源清单 + 游戏补丁）
├── boot.json.bak2     # boot.json 的备份
├── _s.js              # boot.json 同步脚本
├── README.md          # 进度说明
├── img/               # 所有 PNG 图片资源 (8877 张)
│   ├── body/          # 身体部件
│   ├── clothes/       # 服装（最大模块）
│   ├── hair/          # 发型
│   ├── face/          # 面部
│   ├── bodywriting/   # 身体涂鸦
│   ├── transformations/ # 转化
│   ├── decorations/   # 装饰
│   ├── misc/          # 杂项
│   └── ui/            # UI
└── game/              # 游戏逻辑补丁
    ├── decorations.txt
    └── addon-replace/
        ├── clothingCategories-v2-Clothing Shop Categories.txt
        ├── clothingCategories-v2-widget.txt
        └── clothing-Clothing Shop Widgets.txt
```

### 源文件位置

```
susato/date/
├── Degrees of Lewdity.html   # DoL 游戏源码（用于查找原始 clothing 配置）
└── .date/                     # 学习记录（本文件所在目录）
```

---

## 一、boot.json 结构

boot.json 是 ModLoader 加载的核心文件，包含两大功能：

### 1.1 资源清单

```json
{
  "name": "susato-model ZH",
  "version": "2.0",
  "styleFileList": [],
  "scriptFileList": [],
  "tweeFileList": [],
  "imgFileList": [
    "img/body/base-classic.png",
    ...
  ]
}
```

`imgFileList` 列出了所有需要加载的 PNG 图片，共 8877 张，按 `_s.js` 的 `grp()` 函数分组排序。

### 1.2 游戏补丁 (addonPlugin)

```json
"addonPlugin": [
  {
    "modName": "ReplacePatcher",
    "params": {
      "js": [
        {
          "_comment1": "058 Crop top 短上衣开全胸差",
          "fileName": "clothing-upper.js",
          "from": "...",
          "to": "..."
        }
      ]
    }
  }
]
```

每个补丁条目包含：
| 字段 | 说明 |
|------|------|
| `_comment1` | 补丁编号和描述 |
| `fileName` | 目标游戏 JS 文件 |
| `from` | 原始代码（精确匹配用于替换） |
| `to` | 替换后的代码 |

---

## 二、_s.js 同步脚本

### 核心功能

将 `boot.json` 的 `imgFileList` 与 `img/` 目录下的实际 PNG 文件同步。

### 工作流程

1. 读取 `boot.json`（保留原始字符串 `c` + 解析对象 `d`）
2. 递归扫描 `img/` → 收集所有 `.png` → 存入 `disk[]`
3. 对比差异：`miss` = 磁盘有但清单无，`extra` = 清单有但磁盘无
4. 用 `disk` 替换 `d.imgFileList`
5. 按 `grp()` 分组重建 JSON 文本
6. `JSON.parse()` 验证合法性
7. 验证通过 → 写入 `boot.json`

### 运行方式

```bash
cd <mod-dir>
node _s.js
```

### grp() 分组函数

将图片路径映射为排序键，确保同类图片在 JSON 中聚在一起：

| 键 | 路径前缀 | 说明 |
|----|---------|------|
| 01 | `img/body/breasts/` | 胸部 |
| 02 | `img/body/cum/` | 液体 |
| 03 | `img/body/mannequin/` | 人体模型 |
| 04 | `img/body/pregnant-belly/` | 孕肚 |
| 05 | `img/body/` | 身体其他 |
| 06 | `img/bodywriting/` | 身体涂鸦 |
| 07 | `img/clothes/props/` | 服装道具 |
| 08 | `img/clothes/` | 服装（按子类细分） |
| 09 | `img/misc/` | 杂项 |
| 10 | `img/decorations/` | 装饰 |
| 11 | `img/transformations/` | 转化 |
| 12 | `img/face/` | 面部 |
| 13 | `img/hair/` | 发型 |
| 14 | `img/ui/` | UI |
| 99 | 其他 | 未分类 |

---

## 三、breast_img 补丁系统

### 3.1 什么是 breast_img

在 DoL 中，每件上衣 (upper clothing) 有一个 `breast_img` 属性，控制不同胸围尺寸下显示的图片。

### 3.2 两种 breast_img 格式

**简洁形式** — 使用 clothing 自身的编号图片：

```
breast_img: 1
```
→ 游戏自动加载 `0.png`, `1.png`, `2.png` ... `6.png`（共7个胸围尺寸）

**显式映射** — 手动指定每个胸围尺寸对应的图片编号：
```
breast_img: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }
```
→ `0: 0` 表示胸围0用 `0.png`，`6: 6` 表示胸围6用 `6.png`

**缺失胸差**（需要修复的模式）：
```
breast_img: { 0: null, 1: null, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5 }
```
→ 胸围0和1显示为 `null`（无胸/平板），胸围6被错误地映射到5号图

### 3.3 补丁 from/to 构造规则

`from` 必须精确匹配游戏源码中的代码段：

```
breast_img: { 0: null, 1: null, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5 },\n\t\t\tcursed: 0,\n\t\t\tlocation: 0,\n\t\t\ticonFile: "crop_top.png",
```

注意：
- 使用 `\t` 表示 Tab 缩进
- 使用 `\n` 表示换行
- `iconFile` 必须匹配以确保只替换目标服装

### 3.4 查找原始 breast_img 的方法

1. 打开 `susato/date/Degrees of Lewdity.html`
2. 搜索服装名称（如 `"crop top"`）
3. 找到 `breast_img:` 行，记录原始值
4. 确认 `iconFile` 名称

---

## 四、添加新补丁的标准流程

1. **确认图片存在**：`img/clothes/upper/<服装名>/0.png` ~ `6.png` 必须齐全
2. **查源码**：在 `date/Degrees of Lewdity.html` 中找到原始 `breast_img` 和 `iconFile`
3. **构造补丁**：复制格式，修改 `from`/`to`
4. **插入 boot.json**：在 `addonPlugin[0].params.js` 数组的合适位置插入
5. **运行 `_s.js`**：同步 `imgFileList`
6. **验证**：`JSON.parse` 通过，无语法错误

---

## 五、补丁放置规则

- 所有新补丁放在 `js` 数组底部（`]` 闭合之前，`"twee": [` 之上）
- 命名格式：`"_comment1": "编号 名称 描述 v版本号 日期 :P"`
- `:P` 为更新者标识

## 六、2026-07-04 操作记录

### 新增 8 个全胸差补丁

| 编号 | 名称 | 原版 breast_img | 修复项 |
|------|------|----------------|--------|
| 012 | Turtleneck | `{0:null,1:null,2:2,3:3,4:4,5:5,6:6}` | 0, 1 |
| 013 | V neck | `{0:null,1:1,2:2,3:3,4:4,5:5,6:5}` | 0, 6 |
| 014 | Polo shirt | `{0:null,1:1,2:2,3:3,4:4,5:4,6:4}` | 0, 5, 6 |
| 015 | Cable knit cardigan | `{0:null,1:null,2:null,3:3,4:4,5:5,6:5}` | 0, 1, 2, 6 |
| 016 | Jumper | `{0:null,1:null,2:null,3:3,4:3,5:5,6:5}` | 0, 1, 2, 4, 6 |
| 017 | Halter sundress | `{0:null,1:null,2:null,3:3,4:3,5:5,6:6}` | 0, 1, 2, 4 |
| 018 | Diving suit | `{0:null,1:null,2:2,3:3,4:3,5:5,6:5}` | 0, 1, 4, 6 |
| 058 | Crop top | `{0:null,1:null,2:2,3:3,4:4,5:5,6:5}` | 0, 1, 6 |

### 2026-07-05 新增

| 编号 | 名称 | 原版 breast_img | 修复项 |
|------|------|----------------|--------|
| 010 | Gingham/Patterned dress | `{0:null,1:null,2:2,3:3,4:3,5:5,6:6}` | 0, 1, 4 （修复错误补丁） |
| 019 | Cropped hoodie | `{0:null,1:null,2:null,3:3,4:3,5:5,6:6}` | 0, 1, 2, 4 |
| 020 | Evening gown | `{0:null,1:null,2:2,3:3,4:4,5:5,6:6}` | 0, 1 |
| 021 | Kimono mini | `{0:1,1:1,2:1,3:3,4:4,5:5,6:6}` | 0, 1, 2 |
| 022 | Kimono | `{0:1,1:1,2:1,3:3,4:4,5:5,6:6}` | 0, 1, 2 |

全部统一为：`breast_img: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }`

### 累计 13 个全胸差补丁

### 图片补充

- **Polo**: 用 `1.png` 复制出缺失的 `0.png`、`0-gray.png`、`1-gray.png`，用 `5.png`/`6.png` 复制出 `5-gray.png`/`6-gray.png`

### 常见 breast_img 缺陷模式

| 模式 | 示例 | 问题 |
|------|------|------|
| 0/1 为 null | `0:null, 1:null` | 小胸无图，复用平板 |
| 尾部截断 | `4→3, 5→5, 6→5` | 大胸复用中等尺寸图 |
| 中段塌陷 | `3→3, 4→3, 5→5` | 中等尺寸复用偏小图 |

---

## 七、DoL 面部系统 (img/face/default/)

### 架构：分层合成渲染

面部通过叠加多层 PNG 合成，分为**根目录通用层**和**6种眼型风格**。

### 根目录通用层 (22 个文件)

| 文件 | 功能 |
|------|------|
| `blush-1`~`5`, `blusher` | 脸红/腮红 (6级) |
| `ears.png` | 耳朵 |
| `freckles.png` | 雀斑 |
| `lipstick-*` | 唇彩 (5嘴型) |
| `mouth-*` | 嘴型 (chew/cry/frown/neutral/smile) |
| `tears-1`~`4` | 眼泪 (4级) |

### 6 种眼型子目录 (各 15 个文件)

| 目录 | 风格 |
|------|------|
| `default/` | 默认普通 |
| `aloof/` | 冷淡高傲 |
| `catty/` | 猫系 |
| `foxy/` | 狐系 |
| `gloomy/` | 忧郁阴沉 |
| `sweet/` | 甜美温柔 |

### 眼型组件 (每个目录相同结构)

| 组件 | 变体 | 作用 |
|------|------|------|
| `brow` | low / mid / orgasm / top | 眉毛位置 |
| `eyelids` | 正常 / half-closed | 眼睑 |
| `eyes` | eyes | 眼框轮廓 |
| `iris` | 正常 / empty / half-closed / empty-half-closed | 虹膜 |
| `lashes` | 正常 / half-closed | 睫毛 |
| `sclera` | 正常 / bloodshot | 眼白 |

### 合成顺序

```
sclera → iris → eyes → eyelids → lashes → brows     (眼型子目录)
   + mouth + lipstick + blush + tears + ears + freckles   (根目录通用层)
= 最终面部
```

> **嘴巴 (mouth) 在根目录**，所有 6 眼型共用 5 张嘴型 + 5 张唇彩。

总计：6眼型×15组件 + 22通用 = **112 张面部图片**

---

## 八、2026-07-05 操作记录

### 新增 Twee 补丁：理发店渲染回退

| 项目 | 值 |
|------|-----|
| 类型 | Twee (ReplacePatcher) |
| 目标段落 | `Hairdressers Widgets` |
| from 长度 | 8,970 字符 |
| to 长度 | 3,329 字符 |

**回退内容**：隐藏手臂、去除 50 行 TF chimera 预览代码、恢复旧式 white 套装着装、移除 `hidelayer "base"`。

### Twee 补丁关键教训

1. **段落定位**：Widget 的调用和定义可能在不同段落。`mannequinHairdresser` 在 `Hairdressers Widgets`（非 `Hairdressers Seat`）
2. **空格问题**：文件夹名含空格时 `for d in $(ls)` 会错误拆分，必须用 `find ... -print0 | while IFS= read -r -d ''`
3. **提取方法**：`JSON.stringify()` 自动处理 `\t` `\n` 转义，不要手写
4. **验证**：用 `indexOf()` 在解码后的段落内容中确认 from 字符串存在

### 参考文件夹清理

从 `人模/img/clothes/` 移除 susato mod 已有的文件夹（按文件夹名匹配）：
- upper: 49 → **46**（删除 band tee, cat hoodie 等）
- lower: 37 → **29**（删除 8 个重复文件夹）
- 保留 75 文件夹 / 1,642 文件（均为 susato 未收录的参考资源）

### boot.json 当前状态

| 项目 | 数量 |
|------|------|
| JS 补丁 (breast_img) | 8 个 |
| JS 补丁 (specialClothes) | 3 个 |
| Twee 补丁 (渲染/UI) | 7 个 |
| Twee 补丁 (理发店回退) | 1 个 |
| 图片文件 | 8,925 张 |

---

## 九、2026-07-06 操作记录

### more_clothes 合并结果

**来源**：`mod/more_clothes/` (v0.2.4) → 主 mod `susato-model-v5.10-0.7`

**加载方式**：ModdedClothesAddon + ModdedHairAddon + TweeReplacer（TF 已排除）

**冲突处理**：冲突图片加 `extre-` 前缀，JSON 同步改引用

**改名清单**（12 个，全部 `_` → `-`）：

| 位置 | 文件名 |
|------|------|
| `misc/icon/clothes/` | `extre-baseballbat.png`, `extre-card.png`, `extre-clogs.png`, `extre-dumbbell.png`, `extre-geta.png`, `extre-geta-acc.png` |
| `clothes/feet/geta/` | `extre-acc-gray.png`, `extre-full.png` |
| `clothes/handheld/baseballbat/` | `extre-right.png` |
| `clothes/handheld/card/` | `extre-right.png` |
| `clothes/handheld/seethroughumbrella/` | `extre-back.png`, `extre-right.png` |

**JSON 引用更新**：
| 文件 | 原 iconFile | 改为 |
|------|-----------|------|
| `code/addon-clothes/feet.json` | `geta.png` | `extre-geta.png` |
| | `geta_acc.png` | `extre-geta-acc.png` |
| | `clogs.png` | `extre-clogs.png` |
| `code/addon-clothes/handheld.json` | `baseballbat.png` | `extre-baseballbat.png` |
| | `card.png` | `extre-card.png` |
| | `dumbbell.png` | `extre-dumbbell.png` |

**boot.json 变更**：
- `addonPlugin` +2：ModdedClothesAddon, ModdedHairAddon
- `additionFile` +2：addon-hair, code 文件
- `imgFileList` +287

**未合并**：`code/addon-TF/` 及对应 TweeReplacer 条目

---

## 十、2026-07-08 操作记录

### boot.json 结构性修复

- 补全 `author`、`description`、`additionFile`、`additionDir` 缺失字段
- 修复重复 `additionFile`/`additionDir` key（曾出现在第 8 行和底部两处）
- 删除 10 个 from/to 均为空的无效补丁
- `Readme.txt` → `README.md`（磁盘文件名修正）
- `_s.js` 同步 imgFileList：9797 → 10394（+598 装饰图，-1 测试图）

### ModI18N 兼容性：mirrorMood 双入口

- TweeReplacer 的 `decorations.txt` 注入因 ModI18N 翻译 `"Back"` → `"返回"` 导致 findString 匹配失败
- 解决方案：新增一条中文 findString 入口做兜底
- 两个入口互斥，一条失败另一条命中

### 图片命名修正

- `img/clothes/upper/schoolshirt/`：33 个文件 `_` → `-`
- `img/bodywriting/text/`：75 个文件 `_` → `-`（`left_thigh.png` → `left-thigh.png`）
- `text/default/breasts1~6.png` → `breasts-1~6.png`

### 面部系统分析

- `img/face/default/`：6 眼型齐全，共 205 文件
- 发现 gloom makeup 命名错误：`eyeshadows.png`（复数）、`eyeshadow-half-closed.png.png`（双扩展名）
- 17 个旧命名冗余文件（`blush1-5`、`tear1-4`、`mouthcry` 等，游戏不引用）

### 手臂 Z 序研究（未完成）

- 根因：身体臂图包含手，共用一个 z-index
- `armsidle: 30` 远低于 `legs: 66.6`，导致 idle 手被袜子覆盖
- 多次尝试改 ZIndices 值和渲染逻辑，均导致左衣袖消失
- LayerFixes 2.0.5 mod 为旧版游戏编写，from 字符串在当前版本不匹配
- 最终方案搁置

---

## 十一、2026-07-09 操作记录

### 独立 mod 产出

| mod | 说明 |
|-----|------|
| `arms-above-legs/boot.json` | 手臂层级修复（独立可用，未经完整测试） |
| `LayerFixes-Updated/boot.json` | 适配当前游戏版本的层级修复 |

### 日志目录 mod 作者统一

- `每日无衰竭mod.zip`、`特殊衣服全解锁mod.zip`、`理发店回退mod.zip`：author 改为 `画家K`

### breast_img 运行时补丁

**背景**：156 个文本匹配补丁各改一个 breast_img 值，维护困难且和 ModI18N 冲突。

**方案**：在 `init.js` 的 `clothingDataInit()` 末尾注入运行时修复代码。

**逻辑**：
```js
// 遍历 6 个衣物槽位
for (const _s of ["upper","lower","under_upper","under_lower","over_upper","over_lower"]) {
    for (const _item of setup.clothes[_s]) {
        if (_item.breast_img === 0) {
            _item.breast_img = 1;                    // 0 → 1
        } else if (_item.breast_img && typeof _item.breast_img === "object") {
            if (_vals.some(_v => _v !== null)) {
                _item.breast_img = 1;                // 对象有数值 → 1
            }
        }
        // 全 null 对象 → 跳过（禁胸差如 tuxedo jacket）
    }
}
```

**结果**：JS 补丁从 178 减至 32。156 个 breast_img 补丁被 1 个运行时补丁替代。

### 模块化拆分（已废弃）

尝试拆分为 `boot-base.json` + `patches.json` + `_build.js`，后因 ModLoader 的 ReplacePatcher 不支持 `replaceFile` 外部引用而放弃。三文件已删除，回归单 `boot.json` + `_s.js` 结构。
