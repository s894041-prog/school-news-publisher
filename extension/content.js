// == 校園公告一鍵小幫手 v4.1 (主世界原生權限版) ==
(function() {
  // 使用前可修改 CATEGORY_KEYWORD 為你要勾選的訊息分類（例：教務處、學務處、總務處）
  const CATEGORY_KEYWORD = '教務處';
  const existing = document.getElementById('school-news-helper-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'school-news-helper-panel';
  panel.style.cssText = `
    position: fixed;
    top: 15px;
    right: 20px;
    z-index: 999999;
    background: #ffffff;
    border: 2px solid #2563eb;
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: #1e293b;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 220px;
  `;

  panel.innerHTML = `
    <div style="font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
      🏫 校園公告一鍵小幫手 v4.1
    </div>
    <button id="btn-auto-all" style="
      background: #2563eb; color: white; border: none; border-radius: 6px; padding: 10px 12px;
      cursor: pointer; font-weight: bold; font-size: 14px; text-align: center;
    ">🚀 一鍵完成 (自動填入全部內容)</button>
    <button id="btn-one-click-save" style="
      background: #059669; color: white; border: none; border-radius: 6px; padding: 8px 12px;
      cursor: pointer; font-weight: bold; text-align: center; margin-top: 4px;
    ">💾 儲存並發布</button>
  `;

  document.body.appendChild(panel);

  document.getElementById('btn-auto-all').onclick = function() {
    try {
      // 1. 勾選【指定分類】與【公開】
      Array.from(document.querySelectorAll('label, input')).filter(el => el.textContent.includes(CATEGORY_KEYWORD) || el.value?.includes(CATEGORY_KEYWORD)).forEach(el => el.click());
      Array.from(document.querySelectorAll('label, input')).filter(el => el.textContent.includes('公開') || el.value === 'public' || el.value === '1').forEach(el => el.click());

      // 2. 獲取上傳檔案與真實 URL
      const fileList = [];
      document.querySelectorAll('button, a, span').forEach(btn => {
        if (btn.textContent.trim() === '刪除') {
          const container = btn.parentElement;
          const a = container.querySelector('a');
          let href = a ? (a.getAttribute('href') || '') : '';
          let name = container.textContent.replace('刪除', '').replace(/\(\d+\s*[kKmM][bB]\)/g, '').trim();
          
          if (!href && a && a.onclick) {
            const m = a.onclick.toString().match(/['"](\/application\/news-home\/show-file\/[^'"]+)['"]/);
            if (m) href = m[1];
          }
          if (name) {
            fileList.push({ name: name, href: href });
          }
        }
      });

      // 排序：公文函排第一，其餘依附件序號排序
      fileList.sort((a, b) => {
        if (a.name.includes('_函_')) return -1;
        if (b.name.includes('_函_')) return 1;
        return a.name.localeCompare(b.name, 'zh-TW');
      });

      // 3. 自動設定標題
      let title = '';
      for (const f of fileList) {
        const m = f.name.match(/(?:_函_|_附件\d+_)([^.]+)/);
        if (m) {
          title = m[1].replace(/^[，,、]/, '').replace(/(，請查照|，請照辦|，請核示|，請惠允貴校出席人員公假登記|。)$/g, '').trim();
          break;
        }
      }
      if (!title && fileList.length > 0) {
        title = fileList[0].name.replace(/\.[^/.]+$/, '').trim();
      }

      const titleInput = document.querySelector('input[name*="title"], input[id*="title"], input.form-control');
      if (titleInput && title) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 4. 生成排版內容
      let html = '<p>說明：請參閱相關公文與附件說明，踴躍報名參加。</p><p><strong>【公文與附件下載】</strong></p><ol>';
      fileList.forEach(f => {
        const linkHref = f.href || '#';
        html += '<li style="margin-bottom: 6px;"><a href="' + linkHref + '" target="_blank" rel="noopener">' + f.name + '</a></li>';
      });
      html += '</ol>';

      // 5. 原生操作 TinyMCE (MAIN world 無受限)
      let done = false;
      if (window.tinymce) {
        const ed = tinymce.activeEditor || (tinymce.editors && tinymce.editors[0]);
        if (ed) {
          ed.setContent(html);
          ed.save();
          done = true;
        }
      }

      if (!done) {
        const ifr = document.querySelector('iframe.tox-edit-area__iframe') || document.querySelector('iframe[id*="mce"]') || document.querySelector('iframe');
        if (ifr && ifr.contentDocument && ifr.contentDocument.body) {
          ifr.contentDocument.body.innerHTML = html;
          done = true;
        }
      }

      document.querySelectorAll('textarea').forEach(ta => {
        ta.value = html;
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      });

      alert(`🎉 成功完成！\n標題：${title || '已填入'}\n已自動排列並插入 ${fileList.length} 個附件下載連結！`);
    } catch(err) {
      alert('發生錯誤：' + err.message);
    }
  };

  document.getElementById('btn-one-click-save').onclick = function() {
    const saveBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(b => b.textContent.includes('儲存') || b.value?.includes('儲存'));
    if (saveBtn) {
      saveBtn.click();
    } else {
      alert('請點擊右下角藍色【儲存】按鈕！');
    }
  };
})();
