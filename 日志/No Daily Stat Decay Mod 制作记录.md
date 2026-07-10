# No Daily Stat Decay Mod 制作记录

## 适用场景

当需要阻止 DoL 中体能/意志力/受虐/施虐每天自动衰减时参考。

---

## 一、衰减机制回顾

四个属性在 `dailyPlayerEffects()` JS 函数中每天凌晨自动衰减：

| 属性 | 衰减公式 | 无条件？ |
|------|---------|---------|
| **Willpower** | `V.willpower *= 0.99` | 是，每天 -1% |
| **Masochism** | `V.masochism *= 0.985` | 是，每天 -1.5% |
| **Sadism** | `V.sadism *= 0.985` | 是，每天 -1.5% |
| **Physique** | `V.physique -= V.physique / 2500` (或 `/3000`) | 仅 ≥1000 时 |

---

## 二、补丁策略选择

### 2.1 JS 直接补丁 — 不可行

`dailyPlayerEffects()` 不在任何 `twine-user-script` 标记的 JS 文件中，而是直接嵌在 HTML 的 `<script>` 标签里。`ReplacePatcher` 的 `fileName` 只能打到 twine-user-script 文件，无法触达这里。

### 2.2 Twee 间接补丁 — 可行

利用两个事实：
1. `dailyPlayerEffects()` 衰减后，`StoryCaption` 段落紧接着渲染
2. `StoryCaption` 中已有 `physiquechange` 标志的每日检查代码

在 `StoryCaption` 的 `physiquechange` 检查块末尾，追加反转代码：用除法和加法把四个值恢复原样。

### 2.3 时序

```
dailyPlayerEffects()    → 偷摸扣掉 4 个值
StoryCaption 渲染       → 原有代码弹出「体能退化/提升」提示
                        → 补丁代码立刻把 4 个值加回来
```

---

## 三、反转数学验证

### Willpower / Masochism / Sadism（乘除互为逆运算）

```
原始值 × 0.99 = 衰减值
衰减值 ÷ 0.99 = 原始值（精确）
```

`× 0.985` 同理，`÷ 0.985` 完全精确恢复。`Math.round` 仅用于处理浮点舍入（最大误差 0.5，可忽略）。

### Physique（近似逆运算，误差极小）

```
原始: P
衰减: P × (2499/2500)
反转: P × (2499/2500) × (2501/2500) = P × (6249999/6250000) ≈ P × 0.99999984
```

`P` 最大 20000 时，偏差仅 0.0032，`Math.round` 完全兜底。

---

## 四、性能

补丁代码被 `physiquechange` 标志包裹，每天执行一次（而非每段落渲染都执行），三行除法加一行加法的运算量可忽略不计。

---

## 五、boot.json 结构

```json
{
  "name": "No Daily Stat Decay",
  "version": "1.0.0",
  "addonPlugin": [{
    "modName": "ReplacePatcher",
    "addonName": "ReplacePatcherAddon",
    "params": {
      "twee": [{
        "passageName": "StoryCaption",
        "from": "<原有的 physiquechange 检查块>",
        "to": "<原有块 + 反转代码>"
      }]
    }
  }]
}
```

## 六、关键教训

1. **不是所有 JS 都能用 `fileName` 打补丁**：只有 `twine-user-script` 标记的脚本才能被 ReplacePatcher 的 JS 模式命中。嵌在 HTML `<script>` 标签里的代码不在覆盖范围内。
2. **Twee 段落可以当钩子用**：找一个每天执行一次的 Twee 段落（如 `StoryCaption`），在其中嵌入补偿逻辑，绕过无法直接修改 JS 的限制。
3. **乘除互逆比加减更精确**：`×0.99` → `÷0.99` 是完美逆运算，误差仅来自浮点，远比「先存快照再恢复」之类的方法简洁可靠。
4. **验证数学正确性很重要**：尤其是 `P - P/N` 这种，逆向是 `P' + P'/N` 而不是 `P' + P'/ (N-1)`，必须逐项验算。
