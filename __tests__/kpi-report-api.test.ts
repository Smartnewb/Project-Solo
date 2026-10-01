import AdminService from '../app/services/admin';

import {adminGet, adminPost} from '@/shared/lib/http/admin-fetch';
jest.mock('@/shared/lib/http/admin-fetch', () => ({adminGet: jest.fn().mockResolvedValue({data:{}}), adminPost: jest.fn().mockResolvedValue({data:{}})}));

describe('AdminService.kpiReport', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getLatest는 /admin/v2/kpi-report/latest를 호출한다', async () => {
		await AdminService.kpiReport.getLatest();
		expect(adminGet).toHaveBeenCalledWith('/admin/v2/kpi-report/latest');
	});

	it('getByWeek는 /admin/v2/kpi-report/{year}/{week}를 호출한다', async () => {
		await AdminService.kpiReport.getByWeek(2026, 10);
		expect(adminGet).toHaveBeenCalledWith('/admin/v2/kpi-report/2026/10');
	});

	it('getDefinitions는 /admin/v2/kpi-report/definitions를 호출한다', async () => {
		await AdminService.kpiReport.getDefinitions();
		expect(adminGet).toHaveBeenCalledWith('/admin/v2/kpi-report/definitions');
	});

	it('generate는 /admin/v2/kpi-report/generate를 호출한다', async () => {
		await AdminService.kpiReport.generate(2026, 10);
		expect(adminPost).toHaveBeenCalledWith('/admin/v2/kpi-report/generate', { year: 2026, week: 10 });
	});
});
