import React, { useState } from 'react';
import { getMessage } from '../utils/i18n';

interface FeedbackState {
  message: string;
  status: '' | 'info' | 'success' | 'error';
}

interface ImportExportTabProps {
  settings: Record<string, unknown>;
  setSettings: (settings: Record<string, unknown>) => void;
}

function ImportExportTab({ settings, setSettings }: ImportExportTabProps) {
  const [feedback, setFeedback] = useState<FeedbackState>({ message: '', status: '' });

  const showFeedback = (message: string, status: FeedbackState['status'] = 'info', duration = 3000) => {
    setFeedback({ message, status });
    setTimeout(() => setFeedback({ message: '', status: '' }), duration);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "smarttab_organizer_settings.json";
    a.click();
    showFeedback(getMessage("exportMessage"), 'success');
  };

  const handleImportClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const imported = JSON.parse(re.target!.result as string);
          if (imported && imported.domainRules && imported.regexPresets) {
            setSettings(imported);
            showFeedback(getMessage("importSuccess"), 'success');
          } else {
            throw new Error("Format de fichier invalide.");
          }
        } catch (error) {
          showFeedback(getMessage("importError") + (error as Error).message, 'error', 5000);
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
      <div className="import-export-section">
        <button onClick={handleExport} className="button">{getMessage('exportSettings')}</button>
        <button onClick={handleImportClick} className="button">{getMessage('importSettings')}</button>
      </div>
      {feedback.message &&
        <p className={`feedback-message ${feedback.status}`}>{feedback.message}</p>
      }
    </section>
  );
}

export { ImportExportTab };
