import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OtpVerification } from '../src/components/otp/OtpVerification';
import { ApiError } from '../src/lib/api';

type Props = Partial<React.ComponentProps<typeof OtpVerification>>;
const setup = (p: Props = {}) => {
  const onVerify = vi.fn(p.onVerify ?? (async () => {}));
  const onResend = vi.fn(p.onResend ?? (async () => ({ retryAfter: 60 })));
  const onDone = vi.fn();
  render(<MemoryRouter><OtpVerification email="a@b.co" onVerify={onVerify} onResend={onResend} onDone={onDone} initialCooldown={p.initialCooldown ?? 0} /></MemoryRouter>);
  const boxes = screen.getAllByRole('textbox') as HTMLInputElement[];
  return { onVerify, onResend, onDone, boxes };
};
afterEach(() => vi.useRealTimers());

describe('OtpVerification', () => {
  it('renders four boxes with accessible labels and the one-time-code hint', () => {
    const { boxes } = setup();
    expect(boxes).toHaveLength(4);
    expect(boxes[0]).toHaveAttribute('aria-label', 'Chiffre 1 sur 4');
    expect(boxes[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes[0]).toHaveFocus();
  });

  it('auto-advances, then submits once the fourth digit is typed', async () => {
    const u = userEvent.setup();
    const { boxes, onVerify } = setup();
    await u.keyboard('1');
    expect(boxes[1]).toHaveFocus();
    await u.keyboard('23');
    expect(onVerify).not.toHaveBeenCalled();
    await u.keyboard('4');
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('1234'));
  });

  it('supports arrow keys, Home/End and Backspace', async () => {
    const u = userEvent.setup();
    const { boxes } = setup();
    await u.keyboard('12');
    expect(boxes[2]).toHaveFocus();
    await u.keyboard('{ArrowLeft}'); expect(boxes[1]).toHaveFocus();
    await u.keyboard('{ArrowRight}'); expect(boxes[2]).toHaveFocus();
    await u.keyboard('{Home}'); expect(boxes[0]).toHaveFocus();
    await u.keyboard('{End}'); expect(boxes[3]).toHaveFocus();
    await u.keyboard('{Backspace}'); // empty box 4 -> clears nothing, moves back
    expect(boxes[2]).toHaveFocus();
  });

  it('fills all four boxes on paste and ignores non-digits', async () => {
    const { boxes, onVerify } = setup();
    boxes[0]!.focus();
    fireEvent.paste(boxes[0]!, { clipboardData: { getData: () => ' 9-8 7x6 ' } });
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith('9876'));
  });

  it('shows the success state only after onVerify resolves, then calls onDone', async () => {
    let resolve!: () => void;
    const { boxes, onDone } = setup({ onVerify: () => new Promise<void>((r) => { resolve = r; }) });
    fireEvent.paste(boxes[0]!, { clipboardData: { getData: () => '1234' } });
    expect(await screen.findByText('Vérification…', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.queryByText('Vérifié')).toBeNull();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => { resolve(); });
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('never shows "Vérifié" when the server refuses the code, and reports attempts left', async () => {
    const { boxes, onDone } = setup({ onVerify: async () => { throw new ApiError(400, 'OTP_INVALID', 'Code incorrect.', undefined, { attemptsLeft: 3 }); } });
    fireEvent.paste(boxes[0]!, { clipboardData: { getData: () => '0000' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Code incorrect. 3 essais restants.');
    expect(screen.queryByText('Vérifié')).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    expect(boxes.every((b) => b.value === '')).toBe(true);
  });

  it('locks the inputs when the code expired or attempts are exhausted', async () => {
    const { boxes } = setup({ onVerify: async () => { throw new ApiError(429, 'OTP_LOCKED', 'x'); } });
    fireEvent.paste(boxes[0]!, { clipboardData: { getData: () => '1111' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop d’essais');
    expect(boxes.every((b) => b.disabled)).toBe(true);
  });

  it('disables resend during the countdown and re-enables it after', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup({ initialCooldown: 3 });
    const btn = screen.getByRole('button', { name: /Renvoyer le code dans/ });
    expect(btn).toBeDisabled();
    await act(async () => { vi.advanceTimersByTime(3500); });
    expect(screen.getByRole('button', { name: /Renvoyer le code/ })).toBeEnabled();
  });

  it('resend clears the boxes, unlocks and restarts the countdown with the server value', async () => {
    const u = userEvent.setup();
    const { boxes, onResend } = setup({ onVerify: async () => { throw new ApiError(429, 'OTP_LOCKED', 'x'); }, onResend: async () => ({ retryAfter: 45 }) });
    fireEvent.paste(boxes[0]!, { clipboardData: { getData: () => '1111' } });
    await screen.findByRole('alert');
    await u.click(screen.getByRole('button', { name: /Renvoyer le code/ }));
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: /dans 45 s/ })).toBeDisabled();
    expect(boxes.every((b) => !b.disabled)).toBe(true);
  });
});
