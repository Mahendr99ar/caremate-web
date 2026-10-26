import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Modal isOpen={open} title="Confirm" onClose={() => setOpen(false)} footer={<button type="button">OK</button>}>
        <p>Body</p>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('is labelled by its title and moves focus inside', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Open'));

    const dialog = screen.getByRole('dialog', { name: 'Confirm' });
    expect(dialog).toContainElement(document.activeElement);
  });

  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Open'));

    // Focus starts on the close button; Tab goes to OK, then wraps back.
    await user.tab();
    expect(screen.getByText('OK')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Close dialog')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByText('Open');
    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
