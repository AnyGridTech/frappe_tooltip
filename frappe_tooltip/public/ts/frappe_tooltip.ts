import type { FrappeForm } from "@anygridtech/frappe-types/client/frappe/core";

frappe.provide("frappe.tooltip");

const tooltip = {
	async showUserTips(opts: {
		form?: FrappeForm;
		doctype: string;
		docnames: string | string[];
	}) {
		const { doctype, docnames } = opts;
		const docnameList = Array.isArray(docnames) ? docnames : [docnames];
		const tips = await Promise.all(docnameList.map((docname: string) =>
			frappe.db.get_doc(doctype, docname).then((doc: any) => ({
				docname,
				content: doc.tip_content || '',
				title: doc.title || docname
			}))
		));

		let currentIdx = 0;
		let modalOpen = false;
		let autoTimer: any = null;
		let dialog: any = null;

		// Adiciona CSS global para fade
		if (!document.getElementById('user-tip-fade-style')) {
			const style = document.createElement('style');
			style.id = 'user-tip-fade-style';
			style.innerHTML = `
				.user-tip-fade {
					opacity: 1;
					transition: opacity 0.5s, filter 0.5s;
					filter: none;
				}
				.user-tip-fade.user-tip-fade-out {
					opacity: 0;
					filter: grayscale(1) blur(2px);
				}
				.user-tip-fade.user-tip-fade-in {
					opacity: 1;
					filter: none;
				}
			`;
			document.head.appendChild(style);
		}

		function updateModal(idx: number) {
			const fadeDiv = dialog?.$wrapper[0].querySelector('#user-tip-fade');
			if (fadeDiv) {
				fadeDiv.classList.remove('user-tip-fade-in');
				fadeDiv.classList.add('user-tip-fade-out');
				setTimeout(() => {
					currentIdx = idx;
					const tip = tips[idx];
					if (!tip) return;
					fadeDiv.innerHTML = tip.content;
					fadeDiv.classList.remove('user-tip-fade-out');
					fadeDiv.classList.add('user-tip-fade-in');
					// Atualiza os dots
					const dotsContainer = dialog.$wrapper[0].querySelector('#user-tip-dots');
					if (dotsContainer) {
						const dotsHtml = tips.length > 1 ? `
							<div id="user-tip-dots" style="margin-top:12px;text-align:center;">
								${tips.map((_, i) => `<span class="user-tip-dot" data-dot="${i}" style="display:inline-block;width:12px;height:12px;border-radius:50%;margin:0 6px;background:${i === idx ? '#222' : '#eee'};box-shadow:0 1px 2px rgba(0,0,0,0.08);border:1px solid #bbb;cursor:pointer;transition:background 0.3s;vertical-align:middle;"></span>`).join('')}
							</div>
						` : '';
						dotsContainer.innerHTML = dotsHtml;
					}
					setTimeout(() => {
						const dots = dialog.$wrapper[0].querySelectorAll('.user-tip-dot');
						dots.forEach((dot: Element) => {
							dot.addEventListener('click', function() {
								const dotIdx = parseInt((dot as HTMLElement).getAttribute('data-dot') || '0');
								updateModal(dotIdx);
								if (autoTimer) clearTimeout(autoTimer);
							});
						});
						if (autoTimer) clearTimeout(autoTimer);
						autoTimer = setTimeout(() => {
							let nextIdx = (currentIdx + 1) % tips.length;
							updateModal(nextIdx);
						}, 5000);
					}, 100);
				}, 500);
			}
		}

		function renderModal(idx: number) {
			if (modalOpen) return;
			modalOpen = true;
			currentIdx = idx;
			const tip = tips[idx];
			if (!tip) return;
			const dotsHtml = tips.length > 1 ? `
				<div id="user-tip-dots" style="margin-top:12px;text-align:center;">
					${tips.map((_, i) => `<span class="user-tip-dot" data-dot="${i}" style="display:inline-block;width:12px;height:12px;border-radius:50%;margin:0 6px;background:${i === idx ? '#222' : '#eee'};box-shadow:0 1px 2px rgba(0,0,0,0.08);border:1px solid #bbb;cursor:pointer;transition:background 0.3s;vertical-align:middle;"></span>`).join('')}
				</div>
			` : '';
			const fadeStyle = '';
			const fadeHtml = `<div id="user-tip-fade" class="user-tip-fade user-tip-fade-in">${tip.content}</div>`;
			dialog = new frappe.ui.Dialog({
				title: `💡 Dica:`,
				fields: [
					{
						fieldtype: 'HTML',
						fieldname: 'tip_content_html',
						label: '',
						options: fadeStyle + `<div style="max-height:400px;overflow:auto;">${fadeHtml}</div>` + dotsHtml
					}
				],
				size: 'large'
			});
			dialog.show();
			dialog.$wrapper.on('dialog-closed', () => {
				modalOpen = false;
				if (autoTimer) clearTimeout(autoTimer);
			});
			setTimeout(() => {
				const dots = dialog.$wrapper[0].querySelectorAll('.user-tip-dot');
				dots.forEach((dot: Element) => {
					dot.addEventListener('click', function() {
						const dotIdx = parseInt((dot as HTMLElement).getAttribute('data-dot') || '0');
						updateModal(dotIdx);
						if (autoTimer) clearTimeout(autoTimer);
					});
				});
				if (autoTimer) clearTimeout(autoTimer);
				autoTimer = setTimeout(() => {
					let nextIdx = (currentIdx + 1) % tips.length;
					updateModal(nextIdx);
				}, 5000);
			}, 100);
		}
		renderModal(currentIdx);
	}
};

Object.assign(frappe, { tooltip });