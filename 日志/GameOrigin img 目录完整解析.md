# GameOrigin img 目录完整解析

## 总览

GameOrigin 是 Degrees of Lewdity 的**原版游戏图片资源库**，共 10 个一级目录。

| 目录 | 用途 | 规模 |
|------|------|------|
| `body/` | 身体部件和覆盖层 | 267 文件 |
| `bodywriting/` | 身体涂鸦/纹身 | 13 形状 + 35 文字 |
| `clothes/` | 全部服装系统 | **7,488 文件** (最大) |
| `face/` | 面部表情系统 | 6 眼型 × 15 组件 + 22 通用 |
| `hair/` | 发型系统 | 62+65+20 组合 |
| `misc/` | 杂项/图标/场景 | 数量最多 |
| `sex/` | 性爱场景图层 | 特写 + 全身 |
| `transformations/` | 动物转化部件 | 8 种转化类型 |
| `ui/` | UI 图标 | 硬币/天气/符号 |

---

## 一、body/ — 身体系统 (267 文件)

### 根目录 (23 文件)
身体基础类型、手臂姿态、耳朵史莱姆等。

### 子目录

| 目录 | 内容 |
|------|------|
| `breasts/` (36) | 胸部成长阶段 0-6，含 clothed/slime/urchin/mask 变体 |
| `cum/` (41) | 全身精液覆盖层 (anal/vaginal/mouth/chest/face/feet/arms/neck/thighs) |
| `mannequin/` (18) | 角色创建界面用的人体模型（简化版） |
| `parasites/` (40) | 史莱姆和海胆寄生虫 (cage/clit/tummy，含硬度 0-6) |
| `penis/` (50) | 有蛋阴茎 (condom/chastity/ear-slime，硬度 0-6) |
| `penis-no-balls/` (35) | 无蛋阴茎 |
| `pregnant-belly/` (24) | 怀孕腹部 1-24 阶段 |

**核心机制**：身体部件通过**编号阶段 (0-6)** 表示成长/硬度，各部分独立叠加渲染。

---

## 二、clothes/ — 服装系统 (7,488 文件)

### 16 个身体部位槽位

| 槽位 | 文件数 | 内容 |
|------|--------|------|
| `upper/` | 3,578 | 上衣 (221+ 种) |
| `lower/` | 1,188 | 下装 (216+ 种) |
| `props/` | 700 | 手持道具 (11 子类) |
| `head/` | 355 | 头饰/帽子 (119 种) |
| `under-upper/` | 296 | 内衣上装 |
| `handheld/` | 290 | 手持物 |
| `legs/` | 263 | 腿饰/袜子 |
| `under-lower/` | 238 | 内衣下装 |
| `feet/` | 194 | 鞋类 |
| `face/` | 164 | 面饰/眼镜/口塞 |
| `hands/` | 95 | 手套/手饰 |
| `neck/` | 84 | 颈饰/围巾/项圈 |
| `genitals/` | 32 | 贞操带/假阳具 |
| `masks/` | 10 | 口罩 |
| `back/` | 1 | 背部 (狐狸尾巴肛塞) |
| `belly/` | 0 | (空) |

### 单件衣服内部结构

| 文件名 | 含义 |
|--------|------|
| `full.png` | 完整/基础版 |
| `frayed.png` | 磨损 |
| `torn.png` | 撕裂 |
| `tattered.png` | 破洞 |
| `0.png ~ 6.png` | 胸围尺寸变体 |
| `acc.png` | 饰品变体 |
| `*gray.png` | 灰度版 |
| `left-*.png` / `right-*.png` | 左右分侧 |
| `hold.png` | 手遮胸姿态 |
| `mask.png` | 遮罩 |

---

## 三、face/ — 面部系统

```
face/default/
├── {mouth, lipstick, blush, tears, ears, freckles}.png  (22 通用层)
├── aloof/    ├── brow-*.png (4), eyelids-*.png (2), eyes.png
├── catty/    ├── iris-*.png (4), lashes-*.png (2), sclera-*.png (2)
├── default/  └── makeup/ (eyeshadow, mascara 变体)
├── foxy/
├── gloomy/
└── sweet/
```

- 6 种眼型 × 15 组件 + 通用层
- 合成顺序: sclera → iris → eyes → eyelids → lashes → brows → mouth → lipstick → blush → tears
- 嘴巴在根目录，所有眼型共用

---

## 四、hair/ — 发型系统

### 三层叠加架构

| 层 | 风格数 | 长度档位 |
|----|--------|---------|
| `fringe/` (前发) | 62 | short/shoulder/chest/navel/thighs/feet |
| `sides/` (侧发) | 65 | 同上 6 档 |
| `back/` (后发) | 20 | thighs/feet (少数 navel) |

**理论组合**: 62 × 65 × 20 = **80,600 种发型**

### phair/ — 物理系统
- `pb*.png` + `pbstrip*.png` = 调色板条
- `balls/` = 基于链式物理的发丝球 (7 层 × 4 色板)

### 风格分类
- **基础纹理**: straight/curl/dread/fro/afro/wavy/fluffy
- **剪裁**: bob/layered bob/french bob/buzzcut/mohawk/sidecut
- **束发**: ponytail/twintail/pigtail/sidetail/bun/braid/fishtail
- **修饰**: messy/neat/sleek/ruffled/bedhead/thick/loose/crude
- **不对称**: emo left/emo right/sidetail left/right/braid left/right

---

## 五、bodywriting/ — 身体涂鸦

### 形状 (13 种，各 15 位置图)
butterfly, circle, cross, flame, flower, heart, paw print, skull, square, star, triangle, triquetra, unicorn

### 文字 (35 种短语，各 5-8 位置图)
slut, bitch, fuck-me, use-me, sinner, slave, rape-me, cum-rag, worthless 等

### 位置命名

`breasts-0~6`, `forehead`, `left/right-cheek`, `left/right-shoulder`, `left/right-thigh`, `pubic`

---

## 六、transformations/ — 转化系统 (8 类型)

| 类型 | 部件 |
|------|------|
| **angel** | halo, wings-cover, wings-idle |
| **bird** | eyes, feathers, tail-*, wings-* |
| **cat** | ears, tail-cover, tail-flaunt, tail-idle |
| **cow** | ears, horns, tail-* |
| **demon** | horns, tail-*, wings-* |
| **fallen** | halo, wings-* |
| **fox** | cheeks, ears, tail-* |
| **wolf** | cheeks, ears, hirsute, tail-* |

命名格式: `{风格}[-{变体}][-left/right][-{覆盖动物}].png`

---

## 七、sex/ — 性爱场景

### 特写 (close/)
- `arse/`, `chest/`, `mouth/`, `penis/`, `vagina/`
- 每个含 `entrance`, `penetrated`, `base` 状态
- `npc/` 子目录: beast/horse/machine/npc/tentacle

### 全身 (doggy/)
- 按 NPC 类型分: bear/blackwolf/boar/cat/creature/dog/dolphin/fox/hawk/horse...
- 每层: `{back/front}-{front/over/under}.png`

---

## 八、misc/ — 杂项

| 子目录 | 内容 |
|--------|------|
| `ambient/` | 环境特效 (fire/petals/rain/snow/water/wraith) |
| `icon/` | 图标库 (actions/antiques/clothes/food/furniture/sex-toys 等) |
| `icon/clothes/` | 500+ 服装图标 |
| `locations/` | 80+ 场景背景图 |

---

## 九、ui/ — 用户界面

- 硬币动画 (copper/silver/gold/platinum/jeweled)
- 吊坠 (bronze/silver/gold/rose-gold)
- 属性符号 (awareness/beauty/confidence/deviancy/dominance...)
- 天气图标 (day/night/blood × 12 种天气)
- 服装分类图标 (categories + traits)

---

## 十、关键命名规律汇总

| 系统 | 命名格式 | 示例 |
|------|---------|------|
| 胸部尺寸 | `{N}.png` (0-6) | `3.png` |
| 破损状态 | `{state}.png` | `frayed/torn/tattered/full` |
| 灰度版 | `{name}-gray.png` | `3-gray.png` |
| 头发长度 | `{bodyzone}.png` | `chest.png` / `feet.png` |
| 面部组件 | `{feature}[-{state}].png` | `iris-half-closed.png` |
| 天气UI | `{time}-{condition}.png` | `day-heavy-rain.png` |
| 转化 | `{style}[-{variant}][-direction].png` | `cherub-left-fallenplus.png` |
| 性爱场景 | `{state}[-{layer}].png` | `back-over.png` |
