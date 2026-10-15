import os
import sys
import re
import shutil
from pathlib import Path
import fitz  # PyMuPDF（pip install pymupdf）

def clean_subject(subject_text):
    """清理主旨字串，適合做檔名與公告標題"""
    s = re.sub(r'\s+', '', subject_text)
    s = re.sub(r'([，,、]?(請查照|請照辦|請核示|請查照惠復|請依說明辦理|請查照辦理)[。]?)$', '', s)
    s = re.sub(r'[\\/*?:"<>|]', '_', s)
    return s.strip()

def parse_official_document(pdf_path):
    """解析公文 PDF，取得字號、主旨、附件清單描述"""
    doc = fitz.open(pdf_path)
    text = ''
    for p in doc:
        text += p.get_text() + '\n'
    
    # 1. 發文字號
    doc_num_m = re.search(r'發文字號[：:]\s*([^\n\r]+)', text)
    doc_num = doc_num_m.group(1).strip() if doc_num_m else ''
    
    # 2. 主旨
    subj_m = re.search(r'主旨[：:]\s*([\s\S]+?)(?=說明[：:]|\n\s*說明)', text)
    subject = ''
    if subj_m:
        subject = clean_subject(subj_m.group(1))
    
    # 3. 找出公文內列出的所有 ATTACH 檔名
    attach_codes = re.findall(r'(\d+[\w]*_ATTACH\d+\.\w+)', text)
    
    return {
        'doc_number': doc_num,
        'subject': subject,
        'attach_codes': attach_codes,
        'full_text': text
    }

DEFAULT_TEMP_DIR = str(Path.home() / 'Downloads' / '暫存')


def auto_rename_temp_folder(temp_dir=DEFAULT_TEMP_DIR):
    """掃描暫存資料夾，將 print.pdf 與對應的 ATTACH 附件改為中文"""
    if not os.path.exists(temp_dir):
        print(f"Directory not found: {temp_dir}")
        return []

    results = []
    for root, dirs, files in os.walk(temp_dir):
        for f in files:
            if f.endswith('_print.pdf'):
                pdf_path = os.path.join(root, f)
                info = parse_official_document(pdf_path)
                
                doc_num = info['doc_number']
                subject = info['subject']
                
                if not subject:
                    continue
                
                new_pdf_name = f"{doc_num}_函_{subject}.pdf" if doc_num else f"公文_{subject}.pdf"
                new_pdf_path = os.path.join(root, new_pdf_name)
                
                if pdf_path != new_pdf_path and not os.path.exists(new_pdf_path):
                    os.rename(pdf_path, new_pdf_path)
                    print(f"公文更名: {f} -> {new_pdf_name}")
                
                prefix = f.replace('_print.pdf', '')
                att_files = [af for af in os.listdir(root) if af.startswith(prefix + '_ATTACH')]
                
                renamed_atts = []
                for idx, af in enumerate(sorted(att_files), start=1):
                    ext = os.path.splitext(af)[1]
                    old_att_path = os.path.join(root, af)
                    new_att_name = f"{doc_num}_附件{idx}_{subject}{ext}" if doc_num else f"附件{idx}_{subject}{ext}"
                    new_att_path = os.path.join(root, new_att_name)
                    
                    if old_att_path != new_att_path and not os.path.exists(new_att_path):
                        os.rename(old_att_path, new_att_path)
                        print(f"附件更名: {af} -> {new_att_name}")
                        renamed_atts.append(new_att_path)
                    elif os.path.exists(new_att_path):
                        renamed_atts.append(new_att_path)

                results.append({
                    'title': subject,
                    'doc_number': doc_num,
                    'doc_path': new_pdf_path if os.path.exists(new_pdf_path) else pdf_path,
                    'attachments': renamed_atts,
                    'folder': root
                })

    return results

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    # 可用第一個參數指定資料夾，例：python rename_doc.py D:\\公文暫存
    res = auto_rename_temp_folder(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TEMP_DIR)
    print(f"\n處理完成，共解析 {len(res)} 則公文。")
