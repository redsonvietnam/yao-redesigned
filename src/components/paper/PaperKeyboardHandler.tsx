import React, { forwardRef } from 'react';

interface PaperKeyboardHandlerProps {
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export const PaperKeyboardHandler = forwardRef<HTMLInputElement, PaperKeyboardHandlerProps>(
  ({ onKeyDown, onPaste }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className="sr-only opacity-0 pointer-events-none fixed top-0 left-0"
        autoComplete="off"
        spellCheck={false}
      />
    );
  }
);

PaperKeyboardHandler.displayName = 'PaperKeyboardHandler';
