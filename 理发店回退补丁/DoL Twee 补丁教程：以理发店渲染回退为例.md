# DoL Twee 补丁教程：以理发店渲染回退为例

## 适用场景

当新版游戏修改了某个 Twee Widget 的渲染逻辑，而你的 mod 需要回退到旧版行为时。

---

## 第一步：定位目标代码

### 1.1 找到涉及的 Widget

从报错或对比测试中确认是哪个 widget。本例中，理发店预览用的是 `mannequinHairdresser` widget。

### 1.2 在 HTML 源码中搜索

```bash
grep -n "mannequinHairdresser" "Degrees of Lewdity.html"
```

得到两个位置：
- 调用处（在 `hairDressersOptions` widget 内）
- 定义处（widget 本身）

### 1.3 确定 Widget 所在的 Passage

**这是最容易出错的步骤。** Widget 的「调用」和「定义」可能在不同的 Twee 段落中。

```bash
# 搜索所有包含目标 widget 的 passage
grep -o 'name="[^"]*"' "Degrees of Lewdity.html" | sort -u
```

或者用脚本精确定位：

```js
const html = fs.readFileSync('Degrees of Lewdity.html', 'utf8');
const decoded = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// 找到 widget 定义
const idx = decoded.indexOf('<<widget "mannequinHairdresser">>');

// 向前查找最近的 <tw-passagedata> 标签
const before = decoded.substring(idx - 5000, idx);
const match = before.match(/<tw-passagedata[^>]*name="([^"]+)"/g);
const lastTag = match[match.length - 1];
console.log('Widget 在段落:', lastTag);
```

本例结果：**`Hairdressers Widgets`**（不是 `Hairdressers Seat`！）

> **教训**：Widget 定义通常在 `xxx Widgets` 命名模式的段落中，而调用在业务段落中。

---

## 第二步：提取精确的补丁字符串

### 2.1 解码 HTML 实体

HTML 文件中 Twee 源码是 HTML 编码的（`<<` 写成 `&lt;&lt;`）。必须先解码：

```js
const decoded = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
```

### 2.2 提取 Widget 内容

```js
const widgetMatch = decoded.match(
    /<<widget "mannequinHairdresser">>([\s\S]*?)<<\/widget>>/
);
const widgetBody = widgetMatch[1];
```

### 2.3 提取需要替换的内部块

找到新旧版差异的边界。用不变的锚点界定：

```js
// 新版：从 <<selectmodel "main">> 到 <<rendermodel "canvas-mannequin">>
const newInner = widgetBody.match(
    /(<<selectmodel "main">>[\s\S]*?)<<rendermodel "canvas-mannequin">>/
)[1];

// 旧版：同样的锚点，从旧版 HTML 提取
const oldInner = oldWidgetBody.match(
    /(<<selectmodel "main">>[\s\S]*?)<<rendermodel "canvas-mannequin">>/
)[1];
```

### 2.4 JSON 转义

用 `JSON.stringify()` 自动处理所有转义（`\n`, `\t`, `"`）：

```js
const fromStr = JSON.stringify(newInner);  // 得到带引号的 JSON 字符串
const toStr = JSON.stringify(oldInner);
```

这两个字符串可以直接放入 boot.json 的 `"from"` 和 `"to"` 字段（去掉外层引号，它们是 JSON.stringify 加的）。

---

## 第三步：构造补丁条目

```json
{
  "_comment1": "描述 v版本 日期 :P",
  "passageName": "Hairdressers Widgets",
  "from": "<JSON.stringify 的输出，不含外层引号>",
  "to": "<同上>"
}
```

放入 boot.json 的 `addonPlugin[0].params.twee` 数组中。

---

## 第四步：验证

### 4.1 校验 JSON

```bash
node -e "JSON.parse(require('fs').readFileSync('boot.json','utf8')); console.log('OK')"
```

### 4.2 验证匹配

写脚本确认 `from` 字符串确实在目标段落中：

```js
const decoded = /* 解码后的 HTML */;
const passageMatch = decoded.match(
    /<tw-passagedata[^>]*name="Hairdressers Widgets"[^>]*>([\s\S]*?)<\/tw-passagedata>/
);
console.log('匹配:', passageMatch[1].indexOf(fromStr) >= 0 ? 'YES' : 'NO');
```

### 4.3 实机测试

加载 mod，进入理发店，确认：
- 手臂不显示
- 转化部件不在预览中
- 穿着简化

---

## 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| `cannot find 'from'` | passageName 错误 | 用脚本精确定位 widget 所在段落 |
| 匹配失败 | `\t` `\n` 与实际不符 | 用 `JSON.stringify` 自动转义，不要手写 |
| 部分匹配 | 锚点不够唯一 | 包含更多上下文使其唯一 |
| 没有效果 | 补丁在错误的 addonPlugin | 确认在 `ReplacePatcher` 中 |

---

## 完整脚本模板

```js
// extract_patch.js — 从新旧 HTML 对比中提取 Twee 补丁字符串
const fs = require('fs');

function decode(html) {
    return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

function extractWidget(html, widgetName) {
    const d = decode(html);
    const m = d.match(new RegExp(
        `<<widget "${widgetName}">>([\\s\\S]*?)<</widget>>`
    ));
    return m ? m[1] : null;
}

const newHtml = fs.readFileSync('Degrees of Lewdity.html', 'utf8');
const oldHtml = fs.readFileSync('Degrees of Lewdity旧版.html', 'utf8');

const newBody = extractWidget(newHtml, 'mannequinHairdresser');
const oldBody = extractWidget(oldHtml, 'mannequinHairdresser');

const ANCHOR_START = '<<selectmodel "main">>';
const ANCHOR_END = '<<rendermodel "canvas-mannequin">>';

const newInner = newBody.match(
    new RegExp(`(${ANCHOR_START}[\\s\\S]*?)${ANCHOR_END}`)
)[1];
const oldInner = oldBody.match(
    new RegExp(`(${ANCHOR_START}[\\s\\S]*?)${ANCHOR_END}`)
)[1];

// 这些可以直接贴入 boot.json 的 from/to
fs.writeFileSync('from_string.txt', JSON.stringify(newInner));
fs.writeFileSync('to_string.txt', JSON.stringify(oldInner));

console.log('from length:', newInner.length);
console.log('to length:', oldInner.length);
```

---

## 补丁包结构

```
理发店回退补丁/
└── boot.json    # 仅含一个 Twee 补丁，可直接加载
```

补丁内容：
- **目标**：`Hairdressers Widgets` 段落
- **操作**：替换 `mannequinHairdresser` 内部渲染块
- **效果**：隐藏手臂、去除转化预览、恢复旧式着装
