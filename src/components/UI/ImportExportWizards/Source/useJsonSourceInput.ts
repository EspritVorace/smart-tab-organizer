import React, { useCallback, useRef, useState } from 'react';
import { z } from 'zod';
import { getMessage } from '@/utils/i18n';

export type SourceMode = 'file' | 'text';

export interface JsonSourceValidationResult<T> {
  data: T;
  note: string | null;
}

export interface JsonSourceInputState<T> {
  sourceMode: SourceMode;
  setSourceMode: (mode: SourceMode) => void;
  jsonText: string;
  parsedData: T | null;
  parseError: string | null;
  importedNote: string | null;
  fileName: string | null;
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleTextChange: (text: string) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleBrowse: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

/**
 * Generic state + handlers for the "paste JSON or drop a file" step shared by
 * every import wizard. Consumers pass a `validate` callback that turns the
 * already-JSON.parsed value into a typed payload (or throws a `ZodError`).
 */
export function useJsonSourceInput<T>(
  validate: (raw: unknown) => JsonSourceValidationResult<T>,
): JsonSourceInputState<T> {
  const [sourceMode, setSourceMode] = useState<SourceMode>('file');
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<T | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importedNote, setImportedNote] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateJson = useCallback((text: string) => {
    if (!text.trim()) {
      setParsedData(null);
      setParseError(null);
      setImportedNote(null);
      return;
    }

    try {
      const raw = JSON.parse(text);
      const { data, note } = validate(raw);
      setParsedData(data);
      setImportedNote(note);
      setParseError(null);
    } catch (error) {
      setParsedData(null);
      setImportedNote(null);
      if (error instanceof SyntaxError) {
        setParseError(getMessage('invalidJson'));
      } else if (error instanceof z.ZodError) {
        setParseError(
          error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('\n'),
        );
      } else {
        setParseError(getMessage('errorImportInvalidStructure'));
      }
    }
  }, [validate]);

  const handleTextChange = useCallback((text: string) => {
    setJsonText(text);
    validateJson(text);
  }, [validateJson]);

  const handleFileRead = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
  }, [validateJson]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const reset = useCallback(() => {
    setSourceMode('file');
    setJsonText('');
    setParsedData(null);
    setParseError(null);
    setImportedNote(null);
    setFileName(null);
    setIsDragOver(false);
  }, []);

  return {
    sourceMode,
    setSourceMode,
    jsonText,
    parsedData,
    parseError,
    importedNote,
    fileName,
    isDragOver,
    fileInputRef,
    handleTextChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleBrowse,
    handleFileSelect,
    reset,
  };
}
