import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlockEditor = ({ content, onChange, className = '' }) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'script',
        'indent',
        'direction',
        'size',
        'color', 'background',
        'font',
        'align',
        'link', 'image', 'video'
    ];

    return (
        <div className={`bg-white dark:bg-surface-900 rounded-xl overflow-hidden shadow-sm border border-surface-200 dark:border-surface-700 ${className}`}>
            <style>
                {`
          .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #e5e7eb !important;
            background-color: #f9fafb;
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
          }
          .dark .ql-toolbar {
            background-color: #1e293b;
            border-bottom-color: #334155 !important;
          }
          .ql-container {
            border: none !important;
            font-family: inherit;
            min-height: 400px;
          }
          .ql-editor {
            min-height: 400px;
            padding: 1.5rem;
            font-size: 1rem;
            line-height: 1.75;
          }
          .dark .ql-fill {
            fill: #94a3b8;
          }
          .dark .ql-stroke {
            stroke: #94a3b8;
          }
          .dark .ql-picker {
            color: #94a3b8;
          }
        `}
            </style>
            <ReactQuill
                theme="snow"
                value={content || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                className="h-full"
            />
        </div>
    );
};

export default BlockEditor;
