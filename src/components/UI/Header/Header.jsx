import React from 'react';
import { getMessage } from '../../../utils/i18n';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle.jsx';

function Header({ settings }) {
    return (
        <header>
            <h1>{getMessage('optionsTitle')}</h1>
            <div className="theme-selector">
                <label>{getMessage('darkMode')}</label>
                <ThemeToggle />
            </div>
        </header>
    );
}

export { Header };
