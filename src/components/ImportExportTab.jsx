import React, { useState } from 'react';
import { getMessage } from '../utils/i18n.js';

function ImportExportTab({ settings, setSettings }) {
    const [feedback, setFeedback] = useState({ message: '', status: '' });

    const showFeedback = (message, status = 'info', duration = 3000) => {
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
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const imported = JSON.parse(re.target.result);
                    if (imported && imported.domainRules && imported.regexPresets) {
                        setSettings(imported); // Met à jour l'état global
                        showFeedback(getMessage("importSuccess"), 'success');
                    } else { throw new Error("Format de fichier invalide."); }
                } catch (error) {
                    showFeedback(getMessage("importError") + error.message, 'error', 5000);
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
