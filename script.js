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

                block.querySelector('.remove-btn').addEventListener('click', () => {
                    block.remove();
                });

                block.querySelector('.deliverable-ref').addEventListener('change', function(event) {
                    const preview = document.getElementById(`preview-${blockId}`);
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        preview.innerHTML = ''; // Clear "No image selected" text
                        const img = document.createElement('img');
                        reader.onload = function(e) {
                            img.src = e.target.result;
                        }
                        reader.readAsDataURL(file);
                        preview.appendChild(img);
                    } else {
                        preview.innerHTML = '<span>No image selected</span>';
                    }
                });
            }

            addDeliverableBtn.addEventListener('click', createDeliverableBlock);
            createDeliverableBlock(); // Start with one empty block

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
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();

                    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                        const text = data.candidates[0].content.parts[0].text.trim();
                        resultElement.innerHTML = `<div class="ai-generated-content">${text}</div>`;
                        disclaimerElement.classList.remove('hidden');
                    } else {
                         throw new Error('No valid content received from API.');
                    }
                } catch (error) {
                    console.error('Error with Gemini API:', error);
                    resultElement.innerHTML = `<p class="text-red-600 p-2 bg-red-100 rounded">An error occurred while generating content. Please check the console.</p>`;
                } finally {
                    buttonElement.disabled = false;
                    buttonElement.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
            
            // AI Feature Button Listeners
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
                const prompt = `Based on the objective "${objective}" and target audience "${audience}", suggest 3-5 distinct key messages or taglines. Format as a simple numbered list.`;
                callGeminiAPI(prompt, document.getElementById('messagesResult'), document.getElementById('messagesDisclaimer'), document.getElementById('suggestMessagesBtn'));
            });
            
            document.getElementById('generateIdeasBtn').addEventListener('click', () => {
                const objective = document.getElementById('objective').value;
                const audience = document.getElementById('audience').value;
                if (!objective.trim() || !audience.trim()) { alert('Please fill in the Primary Objective and Target Audience first.'); return; }
                const prompt = `For a project with the objective "${objective}" and target audience "${audience}", suggest a list of 5-7 potential design deliverables (both digital and print). Present them as a simple bulleted list.`;
                callGeminiAPI(prompt, document.getElementById('ideasResult'), document.getElementById('ideasDisclaimer'), document.getElementById('generateIdeasBtn'));
            });

            generateBtn.addEventListener('click', () => {
                let brief = `DESIGN BRIEF\n=========================\n\n`;

                brief += `**Project Name:** ${document.getElementById('projectName').value || 'N/A'}\n`;
                brief += `**Project Manager:** ${document.getElementById('projectManager').value || 'N/A'}\n`;
                brief += `**Date Prepared:** ${document.getElementById('projectDate').value || 'N/A'}\n\n`;

                brief += `--- PHASE 1: STRATEGY ---\n`;
                brief += `**1. Primary Objective:**\n${document.getElementById('objective').value || 'N/A'}\n\n`;
                brief += `**2. Target Audience:**\n${document.getElementById('audience').value || 'N/A'}\n\n`;
                brief += `**3. Key Message:**\n${document.getElementById('keyMessage').value || 'N/A'}\n\n`;
                brief += `**4. Desired Tone & Feel:**\n${document.getElementById('tone').value || 'N/A'}\n\n`;

                brief += `--- PHASE 2: DELIVERABLES & CONTENT ---\n`;
                const blocks = document.querySelectorAll('.deliverable-block');
                if (blocks.length > 0) {
                    blocks.forEach((block, index) => {
                        const name = block.querySelector('.deliverable-name').value;
                        const spec = block.querySelector('.deliverable-spec').value;
                        const copy = block.querySelector('.deliverable-copy').value;
                        const refFile = block.querySelector('.deliverable-ref').files[0];

                        if (name) {
                            brief += `\n**Deliverable ${index + 1}: ${name}**\n`;
                            brief += `   - **Specs:** ${spec || 'N/A'}\n`;
                            if(refFile){
                                brief += `   - **Visual Reference:** [Image Provided - please see attached file: ${refFile.name}]\n`;
                            }
                            brief += `   - **Content/Copy:**\n---\n${copy || 'No copy provided.'}\n---\n`;
                        }
                    });
                } else {
                    brief += 'No deliverables listed.\n\n';
                }

                brief += `\n--- PHASE 3: ASSET LINKS ---\n`;
                brief += `Logos Folder: ${document.getElementById('link-logos').value || 'N/A'}\n`;
                brief += `Images Folder: ${document.getElementById('link-images').value || 'N/A'}\n`;
                brief += `Brand Guidelines: ${document.getElementById('link-brand').value || 'N/A'}\n`;
                brief += `References Folder: ${document.getElementById('link-refs').value || 'N/A'}\n\n`;

                brief += `--- PHASE 4: TIMELINE & CONTACT ---\n`;
                brief += `**First Draft Due:** ${document.getElementById('date-draft').value || 'N/A'}\n`;
                brief += `**Feedback Due:** ${document.getElementById('date-feedback').value || 'N/A'}\n`;
                brief += `**Final Version Due:** ${document.getElementById('date-final').value || 'N/A'}\n`;
                brief += `**Go-Live / Print Date:** ${document.getElementById('date-live').value || 'N/A'}\n`;
                brief += `**Primary Contact:** ${document.getElementById('contact').value || 'N/A'}\n\n`;
                
                brief += `=========================\nThank you!`;
                
                const textarea = document.createElement('textarea');
                textarea.value = brief;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    successMsg.classList.remove('hidden');
                    setTimeout(() => successMsg.classList.add('hidden'), 3000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
                document.body.removeChild(textarea);
            });
        });