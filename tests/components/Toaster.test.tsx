import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { Toaster } from '../../src/components/UI/Toaster/Toaster';
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from '../../src/utils/toast';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

beforeEach(() => {
  vi.useFakeTimers();
});

describe('Toaster', () => {
  it('mounts with the viewport but no toasts initially', () => {
    wrap(<Toaster />);
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
    expect(screen.queryByTestId('toast-success')).toBeNull();
  });

  it('displays a success toast with title and message', () => {
    wrap(<Toaster />);
    act(() => {
      showSuccessToast('Saved', 'Your changes are saved');
    });
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes are saved')).toBeInTheDocument();
  });

  it('displays an error toast variant', () => {
    wrap(<Toaster />);
    act(() => {
      showErrorToast('Error', 'Something went wrong');
    });
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });

  it('displays an info toast variant', () => {
    wrap(<Toaster />);
    act(() => {
      showInfoToast('Heads up', 'Just a note');
    });
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
  });

  it('queues multiple toasts simultaneously', () => {
    wrap(<Toaster />);
    act(() => {
      showSuccessToast('A', 'a');
      showErrorToast('B', 'b');
    });
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });

  it('removes a toast a few ms after the close button is clicked', () => {
    wrap(<Toaster />);
    act(() => {
      showSuccessToast('Bye', 'Closing');
    });
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('toast-btn-close');
    act(() => {
      fireEvent.click(closeBtn);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByTestId('toast-success')).toBeNull();
  });

  it('cleans up the subscription on unmount', () => {
    const { unmount } = wrap(<Toaster />);
    unmount();
    // emitting after unmount must not throw
    expect(() => {
      showSuccessToast('After', 'unmount');
    }).not.toThrow();
  });
});
