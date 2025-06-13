// --- GLOBAL MODAL CONTROLS ---
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title-text');
const modalBody = document.getElementById('modal-body-content');
const modalCloseBtn = document.getElementById('modal-close');
const modalResetBtn = document.getElementById('modal-reset-btn');

function openModal(title, contentTemplateId, scriptRunner, storageKey) {
    const template = document.getElementById(contentTemplateId);
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    const content = template.content.cloneNode(true);
    modalBody.appendChild(content);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (storageKey) {
        modalResetBtn.style.display = 'block';
        modalResetBtn.dataset.storageKey = storageKey;
    } else {
        modalResetBtn.style.display = 'none';
    }

    if (scriptRunner) {
        scriptRunner();
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    modalBody.innerHTML = ''; 
}

modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

modalResetBtn.addEventListener('click', (e) => {
    const key = e.target.dataset.storageKey;
    if (key && confirm(`您確定要清除這個工具的所有已儲存資料嗎？此操作無法復原。`)) {
        localStorage.removeItem(key);
        closeModal();
        // Re-launch the tool to show default state
        if (key === 'nanyinCollateralTrackerData') {
            document.getElementById('launch-tracker').click();
        } else if (key === 'nanyinDesignBriefData') {
            document.getElementById('launch-brief-generator').click();
        }
    }
});

// --- TOOL LAUNCHERS ---
document.getElementById('launch-tracker').addEventListener('click', () => {
    openModal('活動宣傳物料追蹤工具', 'template-tracker', runTrackerScript, 'nanyinCollateralTrackerData');
});
document.getElementById('launch-brief-generator').addEventListener('click', () => {
    openModal('設計簡報生成工具', 'template-brief-generator', runBriefGeneratorScript, 'nanyinDesignBriefData');
});
document.getElementById('launch-docs').addEventListener('click', () => {
    openModal('文件庫', 'template-docs', runDocsScript);
});


// --- SCRIPT FOR COLLATERAL TRACKER ---
function runTrackerScript() {
    const STORAGE_KEY = 'nanyinCollateralTrackerData';
    const defaultData = [
        { id: 1, name: '主視覺海報 (Key Visual Poster)', application: '數碼宣傳及實體張貼', version: 'V1.0', status: '設計中', owner: '設計師', history: [{ date: '2025-06-13', note: 'V1.0 - 提供設計簡報及素材予設計師。' }], nextAction: '設計師提交初稿。', dueDate: '2025-06-20' },
        { id: 2, name: '社交媒體延伸設計 (Social Media)', application: 'Facebook/IG 帖子、限時動態', version: 'V1.0', status: '待辦', owner: '設計師', history: [], nextAction: '等待主視覺海報定稿後，提供已確定的文案及尺寸。', dueDate: '2025-06-23' },
        { id: 3, name: '音樂會舞台背景板 (Concert Backdrop)', application: '音樂會舞台背景、嘉賓合照區', version: 'V1.0', status: '待辦', owner: '設計師', history: [], nextAction: '等待主視覺海報定稿後，提供尺寸及 Logo 檔案。', dueDate: '2025-07-30' },
        { id: 4, name: '活動特稿 (Advertorial)', application: '中期宣傳，刊登於合作媒體', version: 'V2.1', status: '待審批', owner: 'Daisy', history: [{ date: '2025-06-12', note: 'V2.0 - 完成主席及阮教授專訪稿。'}, { date: '2025-06-13', note: 'V2.1 - 根據最新情況更新 Key Points。'}], nextAction: '將 V2.1 版本交予主席及阮教授辦公室作最終核實。', dueDate: '2025-06-18' },
        { id: 5, name: '音樂會場刊 (Concert Programme)', application: '音樂會當日派發給觀眾', version: 'V1.0', status: '內容準備中', owner: 'Daisy', history: [{ date: '2025-06-13', note: 'V1.0 - 完成節目流程初稿。'}], nextAction: '1. 向阮教授索取新曲《情繫蔴地》的最終曲詞。\n2. 確認年輕南音演唱者最終名單及簡介。', dueDate: '2025-07-25' },
        { id: 6, name: 'TWN 內容提交表格', application: '內部刊物報導申請', version: 'V2.0', status: '已完成', owner: 'Daisy', history: [{ date: '2025-06-13', note: 'V2.0 - 已按要求更新 Key Points 並提交。'}], nextAction: '等待編輯部回覆。', dueDate: '2025-06-13' },
    ];
    
    let collateralData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
    
    const grid = document.getElementById('collateral-grid');
    const itemModal = document.getElementById('item-modal-tracker');
    const historyModal = document.getElementById('history-modal-tracker');
    const itemForm = document.getElementById('item-form-tracker');
    const historyForm = document.getElementById('history-form-tracker');
    
    let currentFilterStatus = 'all';
    let currentFilterOwner = 'all';

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collateralData));
    }

    function getDaysUntil(dueDateStr) {
        if (!dueDateStr) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDateStr);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getDueDateClass(dueDateStr) {
        const daysLeft = getDaysUntil(dueDateStr);
        if (daysLeft < 0) return 'due-date-overdue';
        if (daysLeft <= 7) return 'due-date-soon';
        return 'due-date-normal';
    }

    function getStatusSelect(item) {
        const statuses = ['待辦', '內容準備中', '設計中', '待審批', '待製作', '已完成'];
        let options = statuses.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('');
        return `<select class="status-select status-badge-${item.status.replace(/ /g, '')}" data-id="${item.id}">${options}</select>`;
    }

    function populateOwnerFilter() {
        const ownerFilter = document.getElementById('filter-owner');
        const owners = [...new Set(collateralData.map(item => item.owner))];
        ownerFilter.innerHTML = '<option value="all">全部</option>';
        owners.sort().forEach(owner => {
            const option = document.createElement('option');
            option.value = owner;
            option.textContent = owner;
            ownerFilter.appendChild(option);
        });
        ownerFilter.value = currentFilterOwner;
    }

    function renderGrid() {
        if(!grid) return;
        grid.innerHTML = '';
        const filteredData = collateralData.filter(item => {
            const statusMatch = currentFilterStatus === 'all' || item.status === currentFilterStatus;
            const ownerMatch = currentFilterOwner === 'all' || item.owner === currentFilterOwner;
            return statusMatch && ownerMatch;
        });

        if (filteredData.length === 0) {
            grid.innerHTML = `<p class="text-slate-500 md:col-span-2 xl:col-span-3 text-center py-10">沒有符合篩選條件的項目。</p>`;
        }

        filteredData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card p-4 flex flex-col space-y-3';
            card.dataset.id = item.id;
            const dueDateClass = getDueDateClass(item.dueDate);

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg text-slate-800 pr-2">${item.name}</h3>
                    <div class="flex-shrink-0">${getStatusSelect(item)}</div>
                </div>
                <p class="text-xs text-slate-500 -mt-2">${item.application}</p>
                <div class="text-sm space-y-2 flex-grow">
                    <div class="flex justify-between">
                        <span class="font-semibold text-slate-600">版本:</span>
                        <span class="font-mono px-2 py-0.5 bg-gray-100 rounded">${item.version}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-semibold text-slate-600">負責人:</span>
                        <div class="text-right editable-container" data-field="owner" data-value="${item.owner}"><span class="editable owner-text p-1">${item.owner}</span></div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-slate-600">到期日:</span>
                        <div class="editable-container" data-field="dueDate" data-value="${item.dueDate}"><span class="editable due-date-text font-mono p-1 rounded-md text-xs ${dueDateClass}">${item.dueDate}</span></div>
                    </div>
                    <div>
                        <span class="font-semibold text-slate-600 block mb-1">下一步行動:</span>
                        <div class="editable-container" data-field="nextAction" data-value="${item.nextAction}">
                            <div class="editable next-action-text whitespace-pre-wrap bg-slate-50 p-2 rounded-md">${item.nextAction.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                </div>
                <div class="border-t pt-3 flex justify-between items-center">
                    <button class="text-sm text-blue-600 hover:underline view-history-btn">更新紀錄 (${item.history.length})</button>
                    <button class="text-sm text-red-500 hover:text-red-700 delete-item-btn">刪除</button>
                </div>
            `;
            grid.appendChild(card);
        });
        populateOwnerFilter();
        saveData();
    }
    
    modalBody.addEventListener('change', e => {
        if (e.target.matches('.status-select')) {
            const itemId = parseInt(e.target.dataset.id);
            const newStatus = e.target.value;
            const item = collateralData.find(i => i.id === itemId);
            if (item) {
                logHistory(itemId, `狀態由 "${item.status}" 更新為 "${newStatus}"`);
                item.status = newStatus;
                renderGrid();
            }
        }
    });
    
    modalBody.addEventListener('click', e => {
        const target = e.target;
        const container = target.closest('.editable-container');
        const card = target.closest('.card');
        if (!card) return;
        
        const itemId = parseInt(card.dataset.id);
        const item = collateralData.find(i => i.id === itemId);

        if (target.classList.contains('delete-item-btn')) {
            if (confirm(`確定要刪除「${item.name}」嗎？`)) {
                collateralData = collateralData.filter(i => i.id !== itemId);
                renderGrid();
            }
        } else if (target.classList.contains('view-history-btn')) {
            openHistoryModal(item);
        } else if (container && !container.querySelector('.inline-editor-input')) {
            const field = container.dataset.field;
            const originalValue = container.dataset.value;
            let editorHtml;

            if (field === 'nextAction') {
                editorHtml = `<textarea class="inline-editor-input w-full p-2 border rounded-md text-sm" style="min-height: 80px;">${originalValue}</textarea>`;
            } else if (field === 'dueDate') {
                editorHtml = `<input type="date" class="inline-editor-input" value="${originalValue}">`;
            } else {
                editorHtml = `<input type="text" class="inline-editor-input" value="${originalValue}">`;
            }

            container.innerHTML = `${editorHtml}<div class="mt-2 flex justify-end gap-2"><button class="cancel-edit-btn text-xs bg-gray-200 px-2 py-1 rounded">取消</button><button class="save-edit-btn text-xs bg-blue-600 text-white px-2 py-1 rounded">儲存</button></div>`;
            container.querySelector('.inline-editor-input').focus();
        } else if (target.classList.contains('cancel-edit-btn')) {
            renderGrid();
        } else if (target.classList.contains('save-edit-btn')) {
            const editorContainer = target.closest('.editable-container');
            const input = editorContainer.querySelector('.inline-editor-input');
            const field = editorContainer.dataset.field;
            const newValue = input.value;

            if (newValue !== item[field]) {
                item[field] = newValue;
                const fieldLabels = {owner: '負責人', dueDate: '到期日', nextAction: '下一步行動'};
                logHistory(itemId, `手動將「${fieldLabels[field]}」更新為 "${newValue}"`);
            }
            renderGrid();
        }
    });

    function openItemModal() {
        itemForm.reset();
        document.getElementById('modal-title-tracker').textContent = '新增項目';
        itemModal.classList.add('active');
    }
    
    document.getElementById('add-item-btn-tracker').addEventListener('click', openItemModal);
    document.getElementById('cancel-btn-tracker').addEventListener('click', () => itemModal.classList.remove('active'));
    
    itemForm.addEventListener('submit', e => {
        e.preventDefault();
        const newId = collateralData.length > 0 ? Math.max(...collateralData.map(i => i.id)) + 1 : 1;
        collateralData.push({
            id: newId,
            name: document.getElementById('item-name-tracker').value.trim(),
            application: document.getElementById('item-application-tracker').value.trim(),
            version: 'V1.0',
            status: '待辦',
            owner: document.getElementById('item-owner-tracker').value.trim(),
            history: [{ date: new Date().toISOString().split('T')[0], note: '項目已建立。' }],
            nextAction: '規劃初始步驟。',
            dueDate: document.getElementById('item-due-date-tracker').value
        });
        renderGrid();
        itemModal.classList.remove('active');
    });

    const historyLog = document.getElementById('history-log-tracker');
    const historyItemIdInput = document.getElementById('history-item-id-tracker');
    const historyNoteInput = document.getElementById('history-note-tracker');
    
    function openHistoryModal(item) {
        historyForm.reset();
        historyItemIdInput.value = item.id;
        historyLog.innerHTML = '';
        if (item.history.length === 0) {
            historyLog.innerHTML = '<p class="text-slate-500 text-sm">暫無紀錄。</p>';
        } else {
            [...item.history].reverse().forEach(entry => {
                historyLog.innerHTML += `<div class="text-sm p-2 bg-slate-100 rounded"><span class="font-semibold">${entry.date}:</span> ${entry.note}</div>`;
            });
        }
        historyModal.classList.add('active');
    }

    document.getElementById('close-history-btn-tracker').addEventListener('click', () => historyModal.classList.remove('active'));
    historyForm.addEventListener('submit', e => {
        e.preventDefault();
        const itemId = parseInt(historyItemIdInput.value);
        const note = historyNoteInput.value.trim();
        if (note) {
            logHistory(itemId, note);
            const item = collateralData.find(i => i.id === itemId);
            renderGrid();
            openHistoryModal(item);
        }
    });

    function logHistory(itemId, note) {
        const item = collateralData.find(i => i.id === itemId);
        if (item) {
            item.history.push({
                date: new Date().toISOString().split('T')[0],
                note: note
            });
            const versionRegex = /(V|version|版本)\s?(\d+\.\d+)/i;
            const match = note.match(versionRegex);
            if (match && match[2]) {
                item.version = "V" + match[2];
            }
        }
    }
    
    document.getElementById('filter-status').addEventListener('change', e => { currentFilterStatus = e.target.value; renderGrid(); });
    document.getElementById('filter-owner').addEventListener('change', e => { currentFilterOwner = e.target.value; renderGrid(); });

    renderGrid();
}

// --- Script for Brief Generator ---
function runBriefGeneratorScript() {
    const STORAGE_KEY = 'nanyinDesignBriefData';
    const formContainer = document.getElementById('brief-form-container');

    function saveBriefData() {
        const data = {
            projectName: document.getElementById('projectName').value,
            projectManager: document.getElementById('projectManager').value,
            projectDate: document.getElementById('projectDate').value,
            objective: document.getElementById('objective').value,
            audience: document.getElementById('audience').value,
            keyMessage: document.getElementById('keyMessage').value,
            tone: document.getElementById('tone').value,
            deliverables: [],
            links: {
                logos: document.getElementById('link-logos').value,
                images: document.getElementById('link-images').value,
                brand: document.getElementById('link-brand').value,
                refs: document.getElementById('link-refs').value
            },
            timeline: {
                draft: document.getElementById('date-draft').value,
                feedback: document.getElementById('date-feedback').value,
                final: document.getElementById('date-final').value,
                live: document.getElementById('date-live').value,
                contact: document.getElementById('contact').value
            }
        };

        const deliverableBlocks = document.querySelectorAll('#deliverables-container .deliverable-block');
        deliverableBlocks.forEach(block => {
            data.deliverables.push({
                name: block.querySelector('.deliverable-name').value,
                spec: block.querySelector('.deliverable-spec').value,
                copy: block.querySelector('.deliverable-copy').value,
            });
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadBriefData() {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!savedData) {
            document.getElementById('projectDate').value = new Date().toISOString().split('T')[0];
            createDeliverableBlock(); // Create one default block if no saved data
            return;
        }

        document.getElementById('projectName').value = savedData.projectName || '';
        document.getElementById('projectManager').value = savedData.projectManager || '';
        document.getElementById('projectDate').value = savedData.projectDate || new Date().toISOString().split('T')[0];
        document.getElementById('objective').value = savedData.objective || '';
        document.getElementById('audience').value = savedData.audience || '';
        document.getElementById('keyMessage').value = savedData.keyMessage || '';
        document.getElementById('tone').value = savedData.tone || '';
        
        document.getElementById('link-logos').value = savedData.links?.logos || '';
        document.getElementById('link-images').value = savedData.links?.images || '';
        document.getElementById('link-brand').value = savedData.links?.brand || '';
        document.getElementById('link-refs').value = savedData.links?.refs || '';
        
        document.getElementById('date-draft').value = savedData.timeline?.draft || '';
        document.getElementById('date-feedback').value = savedData.timeline?.feedback || '';
        document.getElementById('date-final').value = savedData.timeline?.final || '';
        document.getElementById('date-live').value = savedData.timeline?.live || '';
        document.getElementById('contact').value = savedData.timeline?.contact || '';

        document.getElementById('deliverables-container').innerHTML = '';
        if (savedData.deliverables && savedData.deliverables.length > 0) {
            savedData.deliverables.forEach(del => createDeliverableBlock(del));
        } else {
            createDeliverableBlock(); // Create a default one if none were saved
        }
    }
    
    formContainer.addEventListener('input', saveBriefData);

    const deliverablesContainer = document.getElementById('deliverables-container');
    const addDeliverableBtn = document.getElementById('add-deliverable-btn');
    
    function createDeliverableBlock(data = {}) {
        const blockId = `deliverable-${Date.now()}`;
        const block = document.createElement('div');
        block.className = 'deliverable-block';
        block.id = blockId;
        
        block.innerHTML = `
            <div class="flex justify-end mb-2"><button class="remove-btn" title="Remove Deliverable">×</button></div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div><label class="form-label text-sm">Deliverable Name</label><input type="text" class="form-input deliverable-name" placeholder="e.g., A2 Poster" value="${data.name || ''}"></div>
                    <div><label class="form-label text-sm">Format / Specs</label><input type="text" class="form-input deliverable-spec" placeholder="e.g., Print, CMYK, 3mm bleed" value="${data.spec || ''}"></div>
                </div>
                <div><label class="form-label text-sm">Visual Reference / Placement</label><div class="image-preview" id="preview-${blockId}"><span>No image selected</span></div><input type="file" class="form-input mt-2 deliverable-ref" accept="image/*"></div>
            </div>
            <div class="mt-4"><label class="form-label text-sm">Content / Text for this Deliverable</label><textarea class="form-textarea deliverable-copy" placeholder="Enter the exact text...">${data.copy || ''}</textarea></div>
        `;
        
        deliverablesContainer.appendChild(block);

        block.querySelector('.remove-btn').addEventListener('click', () => {
            block.remove();
            saveBriefData(); // Save state after removing
        });
        block.querySelector('.deliverable-ref').addEventListener('change', function(event) {
            const preview = document.getElementById(`preview-${blockId}`);
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                preview.innerHTML = '';
                const img = document.createElement('img');
                reader.onload = function(e) { img.src = e.target.result; }
                reader.readAsDataURL(file);
                preview.appendChild(img);
            } else {
                preview.innerHTML = '<span>No image selected</span>';
            }
        });
    }

    addDeliverableBtn.addEventListener('click', () => {
        createDeliverableBlock();
        saveBriefData(); // Save state after adding
    });

    const generateBtn = document.getElementById('generate-btn');
    const successMsg = document.getElementById('copy-success');

    function generateBriefHtml() {
        // This function remains the same as previous version
        const getVal = (id) => document.getElementById(id).value || 'N/A';
        const esc = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
        let deliverablesHtml = '';
        const blocks = document.querySelectorAll('#deliverables-container .deliverable-block');
        blocks.forEach((block) => {
            const name = block.querySelector('.deliverable-name').value;
            if (name) {
                const spec = block.querySelector('.deliverable-spec').value;
                const copy = block.querySelector('.deliverable-copy').value;
                const refFile = block.querySelector('.deliverable-ref').files[0];
                deliverablesHtml += `
                    <tr><td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; font-weight: bold; width: 25%;">${esc(name)}</td><td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top;"><strong>Specs:</strong> ${esc(spec)}<br><strong>Visual Ref:</strong> ${refFile ? `[Image Provided: ${esc(refFile.name)}]` : 'N/A'}</td></tr>
                    <tr><td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; font-weight: bold;">Copy</td><td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; white-space: pre-wrap; word-break: break-word;">${copy ? esc(copy) : '<em>No copy provided.</em>'}</td></tr>`;
            }
        });
        if (deliverablesHtml === '') {
             deliverablesHtml = `<tr><td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0;">No deliverables listed.</td></tr>`;
        }
        return `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; border: 1px solid #ccc; padding: 20px;"><h1 style="font-size: 24px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin: 0 0 20px 0;">Design Brief</h1><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 150px;">Project Name:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectName'))}</td></tr><tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Project Manager:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectManager'))}</td></tr><tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Date Prepared:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectDate'))}</td></tr></table><h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Project Strategy</h2><p><strong>Primary Objective:</strong><br>${esc(getVal('objective'))}</p><p><strong>Target Audience:</strong><br>${esc(getVal('audience'))}</p><p><strong>Key Message:</strong><br>${esc(getVal('keyMessage'))}</p><p><strong>Desired Tone & Feel:</strong><br>${esc(getVal('tone'))}</p><h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Deliverables</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc;">${deliverablesHtml}</table><h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Asset Links</h2><p><strong>Logos:</strong> ${esc(getVal('link-logos'))}<br><strong>Images:</strong> ${esc(getVal('link-images'))}<br><strong>Brand Guidelines:</strong> ${esc(getVal('link-brand'))}<br><strong>References:</strong> ${esc(getVal('link-refs'))}</p><h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Timeline & Contact</h2><p><strong>First Draft Due:</strong> ${getVal('date-draft')}<br><strong>Feedback Due:</strong> ${getVal('date-feedback')}<br><strong>Final Version Due:</strong> ${getVal('date-final')}<br><strong>Go-Live / Print Date:</strong> ${getVal('date-live')}<br><strong>Primary Contact:</strong> ${esc(getVal('contact'))}</p></div>`;
    }

    function copyHtmlToClipboard(html) {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.pointerEvents = 'none';
        container.style.opacity = 0;
        container.innerHTML = html;
        document.body.appendChild(container);
        window.getSelection().removeAllRanges();
        const range = document.createRange();
        range.selectNode(container);
        window.getSelection().addRange(range);
        try {
            document.execCommand('copy');
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 3000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(container);
    }
    
    generateBtn.addEventListener('click', () => {
        const briefHtml = generateBriefHtml();
        copyHtmlToClipboard(briefHtml);
    });
    
    loadBriefData();
}

// --- Script for Document Viewer ---
function runDocsScript() {
    const tabs = document.querySelectorAll('.doc-tab');
    const contentPanes = document.querySelectorAll('.doc-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contentPanes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            document.getElementById(targetId).classList.add('active');
        });
    });
}
