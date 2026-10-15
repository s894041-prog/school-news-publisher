---
name: school-news-announcer
description: >
  自動將下載於「Downloads/暫存」資料夾中的公文與附件更名為中文，
  並協助在臺中市校園資訊系統公告網（school.tc.edu.tw/open-news/open-news-news/index）
  發布最新消息、設定分類（教務處）、公開狀態、上傳附件並在 TinyMCE 內容區自動生成下載超連結。
  當使用者提到「發布公文公告」、「把暫存區公文公告到學校網站」、「新增學校最新消息」、
  「公告公文」等需求時，立即使用此 Skill。
---

# 臺中市校園公告發布 SOP (school-news-announcer)

## 流程概述

本流程自動化處理兩個階段：
1. **本機階段**：解析暫存區（`%USERPROFILE%\Downloads\暫存`）內的公文 PDF（`*_print.pdf`）與附件（`*_ATTACH*.*`），提取發文字號與主旨，全面轉換為易讀之標準中文檔名。
2. **網頁公告階段**：在已登入之學校最新消息網頁（`school.tc.edu.tw/open-news/open-news-news/index`）填寫發布表單，上傳所有附件並在 TinyMCE 編輯器插入超連結。

---

## 步驟一：暫存區公文與附件自動更名

執行 Python 解析與更名模組：
```bash
python scripts/rename_doc.py
```

此腳本將自動：
1. 讀取 PDF 發文字號（例如：`中市教中字第1150078302號`）。
2. 提取公文主旨並過濾「請查照」等贅字。
3. 更名公文：`[發文字號]_函_[主旨].pdf`。
4. 更名所有附件：`[發文字號]_附件[序號]_[主旨].[副檔名]`。
5. 輸出包含公告標題與附件路徑的 JSON 資料。

---

## 步驟二：校園公告網頁表單填報規範

目標網址：`https://school.tc.edu.tw/open-news/open-news-news/index`

### 欄位設定值：
- **標題**：填入公文主旨（例如：`檢送國立臺灣師範大學辦理「2027TEYI世界青少年發明展：臺灣選拔賽」活動簡章`）。
- **訊息分類**：選取 `教務處`（Radio: `input[type="radio"][value*="教務"]` 或對應 label）。
- **是否為內部文件**：選取 `公開`（Radio: `input[type="radio"][value*="公開"]` 或對應 label）。
- **附件管理**：
  1. 點擊「選取檔案」按鈕（`<input type="file" multiple>`），選取更名後的公文與附件檔案。
  2. 點擊「開始上傳」按鈕。
  3. 等候所有附件上傳完成（取得後端給予之附件下載 URL 或檔名清單）。

### 內容編輯區（TinyMCE）插入超連結：
透過 TinyMCE API 或 DOM 直接插入超連結列表：
```javascript
// 範例：將上傳成功的附件列表以 HTML 插入 TinyMCE
const attachments = [
  { name: "公文本文 (PDF)", url: "..." },
  { name: "活動簡章 (PDF)", url: "..." },
  { name: "推薦申請表 (ODS)", url: "..." }
];

let htmlContent = "<p>相關公文與附件下載：</p><ul>";
attachments.forEach(att => {
  htmlContent += `<li><a href="${att.url}" target="_blank">${att.name}</a></li>`;
});
htmlContent += "</ul>";

// 寫入 TinyMCE 編輯器
if (window.tinymce && tinymce.activeEditor) {
  tinymce.activeEditor.setContent(htmlContent);
}
```

### 發布確認：
- 點擊右下角「**儲存**」按鈕發布公告。
