'use client';
// CKEditor 5 (classic) rich-text editor — used to author HTML for article content
// and document descriptions. Loaded client-only via RichEditor (next/dynamic).
import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  BlockQuote,
  Alignment,
  RemoveFormat,
  HorizontalLine,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

export default function RichText({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}) {
  return (
    <CKEditor
      editor={ClassicEditor as any}
      data={value || ''}
      config={{
        licenseKey: 'GPL',
        plugins: [Essentials, Paragraph, Heading, Bold, Italic, Underline, List, Link, BlockQuote, Alignment, RemoveFormat, HorizontalLine],
        toolbar: [
          'undo', 'redo', '|',
          'heading', '|',
          'bold', 'italic', 'underline', 'removeFormat', '|',
          'bulletedList', 'numberedList', '|',
          'alignment', 'link', 'blockQuote', 'horizontalLine',
        ],
        placeholder: placeholder || 'Nhập nội dung…',
      }}
      onChange={(_evt, editor) => onChange && onChange(editor.getData())}
    />
  );
}
