        document.addEventListener('DOMContentLoaded', function () {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('projectDate').value = today;

            const deliverablesContainer = document.getElementById('deliverables-container');
            const addDeliverableBtn = document.getElementById('add-deliverable-btn');
            
            function createDeliverableBlock() {
                const blockId = `deliverable-${Date.now()}`;
                const block = document.createElement('div');
                block.className = 'deliverable-block';
                block.id = blockId;
                
                block.innerHTML = `
                    <div class="flex justify-end mb-2">
                        <button class="remove-btn" title="Remove Deliverable">×</button>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="form-label text-sm">Deliverable Name</label>
                                <input type="text" class="form-input deliverable-name" placeholder="e.g., A2 Poster">
                            </div>
                            <div>
                                <label class="form-label text-sm">Format / Specs</label>
                                <input type="text" class="form-input deliverable-spec" placeholder="e.g., Print, CMYK, 3mm bleed">
                            </div>
                        </div>
                        <div>
                             <label class="form-label text-sm">Visual Reference / Placement</label>
                             <div class="image-preview" id="preview-${blockId}"><span>No image selected</span></div>
                             <input type="file" class="form-input mt-2 deliverable-ref" accept="image/*">
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="form-label text-sm">Content / Text for this Deliverable</label>
                        <textarea class="form-textarea deliverable-copy" placeholder="Enter the exact text to be placed on this deliverable..."></textarea>
                    </div>
                `;
                
                deliverablesContainer.appendChild(block);

                block.querySelector('.remove-btn').addEventListener('click', () => { block.remove(); });
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

            addDeliverableBtn.addEventListener('click', createDeliverableBlock);
            createDeliverableBlock();

            const generateBtn = document.getElementById('generate-btn');
            const successMsg = document.getElementById('copy-success');
            
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            async function callGeminiAPI(prompt, resultElement, disclaimerElement, buttonElement) {
                resultElement.innerHTML = '<div class="flex items-center text-sm text-slate-600"><div class="loading-spinner"></div><span>Generating... Please wait.</span></div>';
                disclaimerElement.classList.add('hidden');
                buttonElement.disabled = true;
                buttonElement.classList.add('opacity-50', 'cursor-not-allowed');
                try {
                    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const data = await response.json();
                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        const text = data.candidates[0].content.parts[0].text.trim();
                        resultElement.innerHTML = `<div class="ai-generated-content">${text}</div>`;
                        disclaimerElement.classList.remove('hidden');
                    } else { throw new Error('No valid content received from API.'); }
                } catch (error) {
                    console.error('Error with Gemini API:', error);
                    resultElement.innerHTML = `<p class="text-red-600 p-2 bg-red-100 rounded">An error occurred while generating content.</p>`;
                } finally {
                    buttonElement.disabled = false;
                    buttonElement.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
            
            document.getElementById('refineObjectiveBtn').addEventListener('click', () => {
                const objective = document.getElementById('objective').value;
                if (!objective.trim()) { alert('Please enter an objective first.'); return; }
                const prompt = `Rewrite this project objective to be clearer and more actionable for a design team. Original: "${objective}"`;
                callGeminiAPI(prompt, document.getElementById('objectiveResult'), document.getElementById('objectiveDisclaimer'), document.getElementById('refineObjectiveBtn'));
            });
            document.getElementById('suggestMessagesBtn').addEventListener('click', () => {
                const objective = document.getElementById('objective').value;
                const audience = document.getElementById('audience').value;
                if (!objective.trim() || !audience.trim()) { alert('Please fill in the Primary Objective and Target Audience first.'); return; }
                const prompt = `For a design project with the objective "${objective}" targeting "${audience}", suggest 3-5 distinct key messages or taglines. Format as a simple numbered list.`;
                callGeminiAPI(prompt, document.getElementById('messagesResult'), document.getElementById('messagesDisclaimer'), document.getElementById('suggestMessagesBtn'));
            });
            document.getElementById('generateIdeasBtn').addEventListener('click', () => {
                const objective = document.getElementById('objective').value;
                const audience = document.getElementById('audience').value;
                if (!objective.trim() || !audience.trim()) { alert('Please fill in the Primary Objective and Target Audience first.'); return; }
                const prompt = `For a project with the objective "${objective}" and target audience "${audience}", suggest a list of 5-7 potential design deliverables (both digital and print). Present them as a simple bulleted list.`;
                callGeminiAPI(prompt, document.getElementById('ideasResult'), document.getElementById('ideasDisclaimer'), document.getElementById('generateIdeasBtn'));
            });

            function generateBriefHtml() {
                const getVal = (id) => document.getElementById(id).value || 'N/A';
                const esc = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

                let deliverablesHtml = '';
                const blocks = document.querySelectorAll('.deliverable-block');
                if (blocks.length > 0) {
                    blocks.forEach((block, index) => {
                        const name = block.querySelector('.deliverable-name').value;
                        const spec = block.querySelector('.deliverable-spec').value;
                        const copy = block.querySelector('.deliverable-copy').value;
                        const refFile = block.querySelector('.deliverable-ref').files[0];
                        if (name) {
                            deliverablesHtml += `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; font-weight: bold; width: 25%;">${esc(name)}</td>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                        <strong>Specs:</strong> ${esc(spec)}<br>
                                        <strong>Visual Ref:</strong> ${refFile ? `[Image Provided: ${esc(refFile.name)}]` : 'N/A'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; font-weight: bold;">Copy</td>
                                    <td style="padding: 10px; border: 1px solid #e2e8f0; vertical-align: top; white-space: pre-wrap; word-break: break-word;">${copy ? esc(copy) : '<em>No copy provided.</em>'}</td>
                                </tr>`;
                        }
                    });
                }
                if (deliverablesHtml === '') {
                     deliverablesHtml = `<tr><td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0;">No deliverables listed.</td></tr>`;
                }

                return `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; border: 1px solid #ccc; padding: 20px;">
                        <h1 style="font-size: 24px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin: 0 0 20px 0;">Design Brief</h1>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr style="background-color: #f8fafc;">
                                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 150px;">Project Name:</td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectName'))}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Project Manager:</td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectManager'))}</td>
                            </tr>
                            <tr style="background-color: #f8fafc;">
                                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Date Prepared:</td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('projectDate'))}</td>
                            </tr>
                        </table>

                        <h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Project Strategy</h2>
                        <div style="margin-bottom: 15px;">
                            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">Primary Objective</h3>
                            <p style="margin: 0; padding: 10px; background-color: #f8fafc; border-radius: 4px;">${esc(getVal('objective'))}</p>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">Target Audience</h3>
                            <p style="margin: 0; padding: 10px; background-color: #f8fafc; border-radius: 4px;">${esc(getVal('audience'))}</p>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">Key Message</h3>
                            <p style="margin: 0; padding: 10px; background-color: #f8fafc; border-radius: 4px;">${esc(getVal('keyMessage'))}</p>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">Desired Tone & Feel</h3>
                            <p style="margin: 0; padding: 10px; background-color: #f8fafc; border-radius: 4px;">${esc(getVal('tone'))}</p>
                        </div>

                        <h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Deliverables</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc;">
                           ${deliverablesHtml}
                        </table>

                        <h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Asset Links</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 150px;">Logos:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('link-logos')}</td></tr>
                            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Images:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('link-images')}</td></tr>
                            <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Brand Guidelines:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('link-brand')}</td></tr>
                            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">References:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('link-refs')}</td></tr>
                        </table>
                        
                        <h2 style="font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0;">Timeline & Contact</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 150px;">First Draft Due:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('date-draft')}</td></tr>
                            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Feedback Due:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('date-feedback')}</td></tr>
                            <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Final Version Due:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('date-final')}</td></tr>
                            <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Go-Live / Print Date:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${getVal('date-live')}</td></tr>
                            <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Primary Contact:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${esc(getVal('contact'))}</td></tr>
                        </table>
                    </div>
                `;
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
                    const successful = document.execCommand('copy');
                    const msg = successful ? 'copied' : 'failed';
                    console.log('Copying HTML table ' + msg);
                    successMsg.classList.remove('hidden');
                    setTimeout(() => successMsg.classList.add('hidden'), 3000);
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(container);
            }

            generateBtn.addEventListener('click', () => {
                const briefHtml = generateBriefHtml();
                copyHtmlToClipboard(briefHtml);
            });
        });
