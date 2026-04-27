import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { Button, Flex } from '@radix-ui/themes';

import { Toaster } from './Toaster';
import { showErrorToast, showInfoToast, showSuccessToast } from '@/utils/toast';

function ToasterPlayground({ autoFire }: { autoFire?: 'success' | 'error' | 'info' | 'stacked' }) {
  useEffect(() => {
    if (!autoFire) return;
    const timer = window.setTimeout(() => {
      if (autoFire === 'success') {
        showSuccessToast('Rules exported', 'Your rules are in the downloads folder.');
      } else if (autoFire === 'error') {
        showErrorToast('Restore failed', '2 tabs could not be reopened.');
      } else if (autoFire === 'info') {
        showInfoToast('Snapshot saved', 'Session "Morning work" stored.');
      } else if (autoFire === 'stacked') {
        showSuccessToast('Rules imported', '3 new rules added.');
        window.setTimeout(() => showSuccessToast('Session exported', 'Copied to clipboard.'), 200);
        window.setTimeout(() => showErrorToast('Restore failed', '1 tab conflict.'), 400);
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [autoFire]);

  return (
    <Flex direction="column" gap="3" p="4" style={{ minHeight: 300 }}>
      <Button onClick={() => showSuccessToast('Success', 'Operation completed.')}>Fire success toast</Button>
      <Button color="red" variant="outline" onClick={() => showErrorToast('Error', 'Something went wrong.')}>
        Fire error toast
      </Button>
      <Button variant="soft" onClick={() => showInfoToast('Info', 'Just so you know.')}>
        Fire info toast
      </Button>
      <Toaster />
    </Flex>
  );
}

const meta: Meta<typeof ToasterPlayground> = {
  title: 'Components/UI/Toaster',
  component: ToasterPlayground,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToasterPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToasterSuccess: Story = {
  name: 'Success',
  args: { autoFire: 'success' },
};

export const ToasterError: Story = {
  name: 'Error',
  args: { autoFire: 'error' },
};

export const ToasterInfo: Story = {
  name: 'Info',
  args: { autoFire: 'info' },
};

export const ToasterStacked: Story = {
  name: 'Stacked',
  args: { autoFire: 'stacked' },
};
