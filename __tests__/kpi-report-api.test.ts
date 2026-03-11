import AdminService from '../app/services/admin';

jest.mock('../utils/axios', () => {
	const mockAxios = {
		get: jest.fn().mockResolvedValue({ data: {} }),
		post: jest.fn().mockResolvedValue({ data: {} }),
		interceptors: {
			request: { use: jest.fn() },
			response: { use: jest.fn() },
		},
	};
	return {
		__esModule: true,
		default: mockAxios,
		axiosMultipart: mockAxios,
		axiosNextGen: mockAxios,
	};
});

const axiosServer = require('../utils/axios').default;

describe('AdminService.kpiReport', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getLatest는 /admin/kpi-report/latest를 호출한다', async () => {
		await AdminService.kpiReport.getLatest();
		expect(axiosServer.get).toHaveBeenCalledWith('/admin/kpi-report/latest');
	});

	it('getByWeek는 /admin/kpi-report/{year}/{week}를 호출한다', async () => {
		await AdminService.kpiReport.getByWeek(2026, 10);
		expect(axiosServer.get).toHaveBeenCalledWith('/admin/kpi-report/2026/10');
	});

	it('getDefinitions는 /admin/kpi-report/definitions를 호출한다', async () => {
		await AdminService.kpiReport.getDefinitions();
		expect(axiosServer.get).toHaveBeenCalledWith('/admin/kpi-report/definitions');
	});

	it('generate는 /admin/kpi-report/generate를 호출한다', async () => {
		await AdminService.kpiReport.generate(2026, 10);
		expect(axiosServer.post).toHaveBeenCalledWith('/admin/kpi-report/generate', { year: 2026, week: 10 });
	});
});
