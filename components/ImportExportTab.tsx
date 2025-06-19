import { h } from 'preact';
import { useState } from 'preact/hooks';
import { getMessage } from '../js/modules/i18n.js';

export interface ImportExportTabProps {
  settings: any;
  setSettings: (s: any) => void;
}

export function ImportExportTab({ settings, setSettings }: ImportExportTabProps) {
  const [feedback, setFeedback] = useState<{ message: string; status: string }>({
    message: '',
    status: ''
  });

  const showFeedback = (message: string, status = 'info', duration = 3000) => {
    setFeedback({ message, status });
    setTimeout(() => setFeedback({ message: '', status: '' }), duration);
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(settings, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'smarttab_organizer_settings.json';
    a.click();
    showFeedback(getMessage('exportMessage'), 'success');
  };

  const handleImportClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = re => {
        try {
          const imported = JSON.parse(String(re.target?.result));
          if (imported && imported.domainRules && imported.regexPresets) {
            setSettings(imported);
            showFeedback(getMessage('importSuccess'), 'success');
          } else {
            throw new Error('Invalid file format.');
          }
        } catch (error: any) {
          showFeedback(
            getMessage('importError') + error.message,
            'error',
            5000
          );
        }
      };
      reader.readAsText(file);
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  return (
    <section id="importexport-section">
      <h2>{getMessage('importExportTab')}</h2>
      <div class="import-export-section">
        <button onClick={handleExport} class="button">
          {getMessage('exportSettings')}
        </button>
        <button onClick={handleImportClick} class="button">
          {getMessage('importSettings')}
        </button>
      </div>
      {feedback.message && (
        <p class={`feedback-message ${feedback.status}`}>{feedback.message}</p>
      )}
    </section>
  );
}
