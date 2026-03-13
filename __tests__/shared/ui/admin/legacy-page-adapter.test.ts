jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    syncExternalAuth: jest.fn(),
  }),
}));

const patchAdminAxios = jest.fn(() => jest.fn());

jest.mock('@/shared/lib/http/admin-axios-interceptor', () => ({
  patchAdminAxios: () => patchAdminAxios(),
}));

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';
import { AdminSessionContext } from '@/shared/contexts/admin-session-context';
import { useCountry } from '@/contexts/CountryContext';

function CountryConsumer() {
  const { country } = useCountry();
  return React.createElement('div', { 'data-testid': 'country' }, country);
}

describe('LegacyPageAdapter', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
  });

  it('provides CountryContext for legacy pages inside AdminShell', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(
          AdminSessionContext.Provider,
          {
            value: {
              session: {
                user: {
                  id: 'admin-1',
                  email: 'admin@example.com',
                  roles: ['admin'],
                },
                selectedCountry: 'jp',
                issuedAt: Date.now(),
              },
              isLoading: false,
              error: null,
              changeCountry: async () => {},
              logout: async () => {},
            },
          },
          React.createElement(
            LegacyPageAdapter,
            null,
            React.createElement(CountryConsumer),
          ),
        ),
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector('[data-testid="country"]')?.textContent).toBe('jp');
    expect(container.textContent).not.toContain('페이지 로딩 오류');
    expect(patchAdminAxios).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
