import type { FrappeForm } from "@anygridtech/frappe-types/client/frappe/core";

interface TooltipModule {
	showUserTips(opts: {
		form?: FrappeForm;
		doctype: string;
		docnames: string | string[];
	}): Promise<void>;
}

declare global {
	interface Frappe {
		tooltip: TooltipModule;
	}
}

export {};
