# DoL 技能、属性与声望系统完整解析

## 总览

Degrees of Lewdity 的技能/属性系统分为四大板块：

| 板块 | 内容 | 核心机制 |
|------|------|---------|
| **学业技能** | Science / Maths / English / History | Trait 等级制 (F→A*)，映射到 skill 值 |
| **体术/生活技能** | Physique / Willpower / Skulduggery / Dancing / Swimming / Athletics / Tending / Housekeeping | 直接数值 0-1000/20000，受装备/TF 修正 |
| **性技能** | Oral / Vaginal / Penile / Anal / Hand / Feet / Bottom / Thigh / Chest / Seduction | 0-1000，每使用一次 +5 |
| **控制属性** | Promiscuity / Exhibitionism / Deviancy | 0-100 六级制，解锁更露骨的行为 |

额外系统：**Fame (声望)** / **Body Stats (身体属性)** / **Allure (诱惑度)** / **Trauma & Stress (创伤与压力)**

---

## 一、学业技能系统

### 1.1 核心数据结构

| 科目 | Skill 变量 (0-1000) | Trait 变量 (-1~4) | 考试进度 | 星级 |
|------|---------------------|-------------------|---------|------|
| Science | `$science` | `$sciencetrait` | `$science_exam` | `$science_star` |
| Maths | `$maths` | `$mathstrait` | `$maths_exam` | `$maths_star` |
| English | `$english` | `$englishtrait` | `$english_exam` | `$english_star` |
| History | `$history` | `$historytrait` | `$history_exam` | `$history_star` |

`$school` = 四个 subject skill 之和 (0-4000)，`$schooltrait` 按总分映射。

### 1.2 Trait → Skill 映射

`<<school_skill_change>>` widget (line 664284)：

```
trait -1 (F)  → skill 0
trait  0 (D)  → skill 100
trait  1 (C)  → skill 200
trait  2 (B)  → skill 400
trait  3 (A)  → skill 700
trait  4 (A*) → skill 1000
```

### 1.3 Grade 等级与颜色

| Trait | Grade | 颜色 |
|-------|-------|------|
| -1 | F | red |
| 0 | D | purple |
| 1 | C | blue |
| 2 | B | lblue |
| 3 | A | teal |
| 4 | A* | green |

### 1.4 学习效率递减

`<<schoolskillgeneral>>` widget (line 331277)：

| 当前 Trait | 学习倍率 |
|-----------|---------|
| 0 (D) | ×2.4 |
| 1 (C) | ×1.2 |
| 2 (B) | ×0.6 |
| 3 (A) | ×0.3 |

越高年级学习越慢。戴眼镜 +20%，暴露状态 +20%。

### 1.5 考试系统

- 考试通过条件：`$subject_exam >= $subject_exam_difficulty`（难度 1-100 随机）
- 通过 → Trait +1（已是 A* 则获得 Distinction）
- 不通过 → 无惩罚
- 修饰因素：老师好感 +5%、模范学生 +5%、醉酒 -N%、焦虑 -10-20%、发情 -5-10%

### 1.6 各科目实战效果

| 科目 | 效果 | 具体机制 |
|------|------|---------|
| **Science** | 减少疼痛 | `pain *= (1 - sciencetrait/10)`，trait 4 = 减少40% |
| **Maths** | 增加小费 | `tip *= (1 + mathstrait/4)`，trait 4 = 翻倍 |
| **English** | 增强话语 | 战斗中的 plead/demand/mock/tease 等 ×(1+englishtrait) |
| **History** | 揭示捷径 | trait 1+ 解锁隐藏通道/地点 |

---

## 二、体术与生活技能

### 2.1 技能清单

| 技能 | 变量 | 最大值 | 初始值 | 主要修正因素 |
|------|------|--------|--------|-------------|
| **Physique** | `$physique` | 20000 (`$physiquemax`) | 3500 | 体型、孕期、高跟鞋、 rugged 鞋、auriga 神器 |
| **Willpower** | `$willpower` | 1000 (`$willpowermax`) | 200 | 耳中史莱姆（减益） |
| **Skulduggery** | `$skulduggery` | 1000 | 0 | sticky_fingers 手套、sharpEyes 特质、fox TF |
| **Dancing** | `$danceskill` | 1000 | 0 | dance 服装、高跟鞋（减益）、脚镣（减半）、重衣 |
| **Swimming** | `$swimmingskill` | 1000 | 0 | swim 服装、脚蹼、高跟鞋（减益）、重衣 |
| **Athletics** | `$athletics` | 1000 | 0 | chase 特质、高跟鞋/rugged、重衣 |
| **Tending** | `$tending` | 1000 | 0 | plantlover 背景（创伤越高越强） |
| **Housekeeping** | `$housekeeping` | 1000 | 0 | maid 服装（每件 +5%） |

### 2.2 Physique 细节

`$physiquesize` 由初始体型决定 (line 175669)：

| 体型 (bodysize) | physiquesize | 初始 physique |
|----------------|-------------|--------------|
| 0 (瘦小) | 6000 | physiquesize/7×3 ≈ 2571 |
| 1 (普通) | 9000 | ≈ 3857 |
| 2 (强壮) | 12000 | ≈ 5143 |
| 3 (大型) | 15000 | ≈ 6429 |

运动员背景额外 `+ physiquesize/4`。

### 2.3 `currentSkillValue()` 通用修正 (line 64625)

- **moorLuck > 0** → 12 个技能获得 `×(1 + moorLuck/100)` 加成
- **孕期 bellySize ≥ 10** → 4 个体能技能获得递减惩罚（最高 -78%）
- 各技能还有专属修正（见上面表格）

---

## 三、性技能系统

### 3.1 技能清单

9 个性技能 + 1 个诱惑技能，全部 max = **1000**，初始 = **0**：

| 技能 | 变量 | 每次使用 + |
|------|------|-----------|
| Seduction | `$seductionskill` | 5 |
| Oral | `$oralskill` | 5 |
| Vaginal | `$vaginalskill` | 5 |
| Penile | `$penileskill` | 5 |
| Anal | `$analskill` | 5 |
| Hand | `$handskill` | 5 |
| Feet | `$feetskill` | 5 |
| Bottom | `$bottomskill` | 5 |
| Thigh | `$thighskill` | 5 |
| Chest | `$chestskill` | 5 |

### 3.2 核心函数 `skill()` (line 160927)

```js
function skill(type, amount) {
    if (V.statFreeze) return;
    amount = Number(amount);
    if (amount) {
        V[type] = Math.clamp(V[type] + amount, 0, V[type + "max"] || 1000);
    }
}
```

所有性技能 clamp 到 0-1000（因为不存在 `$oralskillmax` 等变量，fallback 到 1000）。

### 3.3 `currentSkillValue()` 对性技能的修正

| 技能 | 修正条件 | 效果 |
|------|---------|------|
| **vaginalskill** | 耳slime focus="pregnancy" + growth>100 | 奖励最高 +(growth-100)/500 |
| **vaginalskill** | 耳slime focus="impregnation" | 惩罚 |
| **penileskill** | 耳slime focus="impregnation" | 奖励（与 vaginal 相反） |
| **penileskill** | 发情 (rut) | 奖励 |
| **analskill** | 无阴道 + 耳slime "pregnancy" | 奖励 |
| **seductionskill** | 耳slime growth>50 | 奖励最高 +(growth-50)/600 |

### 3.4 使用即升级

每次在战斗/遭遇中执行性行动时调用 `<<xxxskilluse>>` widget（line 331196-331245），每使用一次 +5 skill。

### 3.5 相关 Feats

| Feat | 条件 |
|------|------|
| **Sex Specialist** | 全部 9 个性技能达到 1000 |
| **Seductress** | `$seductionskill >= 1000` |

---

## 四、控制属性 (Control Stats)

### 4.1 三项核心属性

| 属性 | 变量 | 范围 | 含义 |
|------|------|------|------|
| **Promiscuity** | `$promiscuity` | 0-100 | 与人型生物性行为的意愿 |
| **Exhibitionism** | `$exhibitionism` | 0-100 | 被看到裸体/表演的意愿 |
| **Deviancy** | `$deviancy` | 0-100 | 与非人/兽类的性行为意愿 |

### 4.2 六级制 (`hasSexStat()`, line 64893)

| Level | 阈值 | 解锁行为 |
|-------|------|---------|
| 1 | ≥1 | 始终可用（基础互动） |
| 2 | ≥15 | 露内裤、轻度挑逗、诱惑检查 |
| 3 | ≥35 | 手淫服务、露骨暴露、多数卖淫 |
| 4 | ≥55 | 口交、用身体换取利益 |
| 5 | ≥75 | 极度露骨行为、煽动群交 |
| 6 | ≥95 | 自毁式极端行为 |

### 4.3 Promiscuity 每日衰减

每天夜晚 -1（非 hard 模式 + 对淫荡感到不适时），line 74787-74790。

### 4.4 压力-控制机制

执行 promiscuity/exhibitionism/deviancy 标记的行动 → 降低 Stress 和 Trauma，恢复 Control 感。频繁执行 → 解锁更露骨的同类行动，但弱行动逐渐失效。

---

## 五、Fame (声望) 系统

### 5.1 声望类型

`$fame` 对象 (line 175284)，所有 fame 值 clamp 到 0-2000：

| Fame 类型 | 属性 | 分类 |
|----------|------|------|
| **sex** | `$fame.sex` | 坏声望（增加 Allure） |
| **prostitution** | `$fame.prostitution` | 坏声望 |
| **rape** | `$fame.rape` | 坏声望 |
| **bestiality** | `$fame.bestiality` | 坏声望 |
| **exhibitionism** | `$fame.exhibitionism` | 坏声望 |
| **pregnancy** | `$fame.pregnancy` | 坏声望（受实际怀孕次数限制） |
| **impreg** | `$fame.impreg` | 坏声望 |
| **good** | `$fame.good` | 好声望（降低 Allure） |
| **scrap** | `$fame.scrap` | 好声望 |
| **business** | `$fame.business` | 好声望 |
| **social** | `$fame.social` | 好声望 |
| **model** | `$fame.model` | 好声望 |
| **pimp** | `$fame.pimp` | 好声望 |

### 5.2 声望等级阈值 (line 285155)

| 阈值 | 坏声望标签 (颜色) | 好声望标签 (颜色) |
|------|------------------|------------------|
| ≥1000 | **Notorious** (red/green) | Notorious (green) |
| ≥600 | **Famous** (pink/teal) | Famous (teal) |
| ≥400 | **Recognised** (purple/lblue) | Recognised (lblue) |
| ≥200 | **Known** (blue/blue) | Known (blue) |
| ≥100 | **Low-key** (lblue/purple) | Low-key (purple) |
| ≥30 | **Obscure** (teal/pink) | Obscure (pink) |

### 5.3 Fame 对 Allure 的影响 (line 163153)

```js
// 坏声望增加 Allure
allure += (sex + prostitution + rape + bestiality + exhibitionism + pregnancy + impreg) / 10
// 好声望降低 Allure
allure -= (good + scrap + business + social + model + pimp) / 2
```

### 5.4 Sex Fame 对 NPC 行为的影响 (line 665741)

| Sex Fame | NPC 求欢概率 |
|----------|------------|
| 0-399 | 16% (1/6) |
| 400-599 | 28% (2/7) |
| 600-800 | 37% (3/8) |
| 800-999 | 44% (4/9) |
| 1000+ | 50% (5/10) |

---

## 六、身体属性 (Body Stats)

### 6.1 体型相关

| 变量 | 范围 | 说明 |
|------|------|------|
| `$physique` | 0-20000 | 体能 |
| `$physiquesize` | 6000-15000 | 体型上限（由 bodysize 决定） |
| `$willpower` | 0-1000 | 意志力 |
| `$beauty` | 0-10000 | 美貌 |

### 6.2 身体部位

| 变量 | 说明 |
|------|------|
| `$breastsize` / `$breastsizemax` / `$breastsizemin` | 胸部尺寸（0-6+） |
| `$bottomsize` / `$bottomsizemax` / `$bottomsizemin` | 臀部尺寸 |
| `$thighstat` / `$thighskill` | 大腿属性/技能 |
| `$player.perceived_breastsize` | 感知胸部尺寸（受 clothing bustresize 影响） |
| `$player.perceived_bottomsize` | 感知臀部尺寸 |

### 6.3 精神状态

| 变量 | 范围 | 说明 |
|------|------|------|
| `$trauma` | 0-`$traumamax`(5000) | 创伤 |
| `$stress` | 0-`$stressmax`(10000) | 压力 |
| `$arousal` | 0-`$arousalmax`(10000) | 性奋 |
| `$allure` | 0-6000+ | 诱惑度（越高越容易被侵犯） |
| `$awareness` | — | 觉知度（认识世界真相的程度） |
| `$masochism` / `$masochism_level` | 0-? | 受虐倾向 |
| `$sadism` / `$sadism_level` | 0-? | 施虐倾向 |

### 6.4 Allure 等级

| Allure 值 | 描述 |
|-----------|------|
| ≥6000 × modifier | "You look like you need to be ravaged." |
| ≥4000 × modifier | "You look perverted." |
| ≥3000 × modifier | "You look lewd." |
| ≥2000 × modifier | "You stand out." |
| ≥1500 × modifier | "You attract attention." |
| ≥1000 × modifier | "You attract glances." |
| <1000 × modifier | "You look unremarkable." |

---

## 七、关键函数速查

| 函数 | 行号 | 用途 |
|------|------|------|
| `currentSkillValue()` | 64625 | 读取技能值（含所有修正） |
| `skill()` | 160927 | 核心技能修改器（clamp 到 max） |
| `hasSexStat()` | 64893 | 检查控制属性是否达到等级要求 |
| `fameSum()` | 65123 | 计算多种 fame 总和 |
| `initCNPC()` | 53503 | 初始化 `C.npc` getter 代理 |

### 5.5 声望昵称系统

每种声望类型有专属昵称 (lines 285171-285185)：

| Fame 类型 | <400 | 400-999 | 1000+ |
|----------|------|---------|-------|
| sex | slut | slut | slut |
| prostitution | whore | whore | whore |
| rape | fucktoy | fucktoy | fucktoy |
| bestiality | bitch | bitch | bitch |
| exhibitionism | flaunter | flaunter | flaunter |
| pregnancy | mother | breeder | broodmother |
| impreg | inseminator | sire | allfather |
| good | do-gooder | do-gooder | do-gooder |
| scrap | scrapper | scrapper | scrapper |
| business | entrepreneur | entrepreneur | entrepreneur |
| social | socialite | socialite | schmoozer |
| model | model | model | show off |

### 5.6 临时 Fame (Pub Fame / Mickey)

- `$pubfame` 对象追踪 Mickey 的任务 (line 270529)
- `$fameDecay` / `$fameDecayTimer` 管理 14 天衰减
- 每日衰减逻辑：timer 倒数，day 变化时扣除 decay 值 (line 75037)

### 5.7 相关 Feats

- **"Shining Reputation"** (line 101695)：所有 7 个坏声望 ≤29 + 所有 5 个好声望 ≥1000

---

## 八、身体属性详情

### 8.1 Beauty (美貌) 等级

| 值 | Level | 颜色 | 描述 |
|----|-------|------|------|
| 0 | 0 | red | "You are plain." |
| ~1429 | 1 | pink | "You are cute." |
| ~2857 | 2 | purple | "You are pretty." |
| ~4286 | 3 | blue | "You are charming." |
| ~5714 | 4 | lblue | "You are beautiful." |
| ~7143 | 5 | teal | "You are ravishing." |
| ~8571 | 6 | green | "Your beauty is divine." |

Beauty 初始值 = `$beautymax / 7` ≈ 1429 (Level 1 "cute")。Trauma 达到 max 时会扣减 beauty。

### 8.2 身体部位尺寸

| 部位 | 变量 | 范围 | 初始值 |
|------|------|------|--------|
| 胸部 | `$player.breastsize` | 0-12 | 0/2/3 (预设决定) |
| 臀部 | `$player.bottomsize` | 0-8 | 0/2/3 |
| 阴茎 | `$player.penissize` | 0-6 | 4 |
| 睾丸 | `$player.ballssize` | 0-6 | 4 |

感知尺寸 (`$player.perceived_breastsize` / `perceived_bottomsize`) 受服装 bustresize/rearresize 影响。

### 8.3 性技能等级字母

`_basicSkillGrades` (line 292827)：

| Skill 值 | Grade | 颜色 |
|----------|-------|------|
| 0 | "None" | red |
| 1 | "F" | pink |
| 200 | "D" | purple |
| 400 | "C" | blue |
| 600 | "B" | lblue |
| 800 | "A" | teal |
| 1000 | "S" | green |

---

## 九、核心 Widget 速查

| Widget | 行号 | 用途 |
|--------|------|------|
| `<<school_skill_change>>` | 664284 | 修改学业 trait 和 skill |
| `<<school_skill_up>>` / `<<school_skill_down>>` | 664276/664280 | 学业升降快捷方式 |
| `<<exam>>` | 664171 | 考试判定 |
| `<<exam_result>>` | 664238 | 考试结果处理 |
| `<<fame>>` | 281662 | 通用声望修改（`<<fame 10 "scrap" "good">>`） |
| `<<fameclamp>>` | 280061 | 所有 fame 钳制到 0-2000 |
| `<<famesex>>` / `<<famerape>>` 等 | 281707+ | 各类型声望修改（带面具/gloryhole 检查） |
| `<<oralskilluse>>` 等 | 331196-331245 | 性技能使用即升级（+5 skill + 设置 skillup flag） |
| `<<thighstat>>` / `<<bottomstat>>` 等 | 331531-331549 | 各部位使用计数器（含 ejacstat 射精计数） |
| `<<skill>>` | 160970 | 通用技能修改宏 |
| `<<pubfameChange>>` | 640673 | 临时声望修改（Mickey 任务） |

## 十、关键行号速查 (补充)

| 项目 | 行号 |
|------|------|
| `$fame` 完整初始化 | 175284-175298 |
| 声望昵称定义 | 285171-285185 |
| 声望等级阈值 | 285155-285169 |
| Fame → Allure 计算 | 163151-163155 |
| Shining Reputation feat | 101695-101711 |
| Kylar fameStage | 175996, 795602-795611 |
| Beauty 等级 | 292736-292745 |
| 基础技能字母等级 | 292827-292849 |
| 感知胸/臀尺寸计算 | 162920-162942 |
| 性技能等级展示 config | 293008-293118 |
| 身体属性初始化 | 175010-175029 |
| Promiscuity 每日衰减 | 74787-74790 |
| $school 总技能值 | 176069 |
