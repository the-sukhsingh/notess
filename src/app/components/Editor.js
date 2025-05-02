'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Dynamically import Editor.js and its tools with no SSR
const EditorJS = dynamic(() => import('@editorjs/editorjs'), { 
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading editor...</div>
});

export default function Editor({ onChange, data }) {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [title, setTitle] = useState(data?.title || 'New Note');
  const [isReady, setIsReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsReady(true);
    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
          editorInstance.current = null;
        } catch (err) {
          console.error('Failed to destroy editor:', err);
        }
      }
    };
  }, []);

  useEffect(() => {
    const initEditor = async () => {
      if (!isReady || !editorRef.current || editorInstance.current) return;

      try {
        const EditorJSPackage = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const List = (await import('@editorjs/list')).default;
        const Checklist = (await import('@editorjs/checklist')).default;
        const Quote = (await import('@editorjs/quote')).default;
        const CodeTool = (await import('@editorjs/code')).default;
        const LinkTool = (await import('@editorjs/link')).default;
        const ImageTool = (await import('@editorjs/image')).default;
        const Table = (await import('@editorjs/table')).default;
        const Marker = (await import('@editorjs/marker')).default;
        const InlineCode = (await import('@editorjs/inline-code')).default;

        const editor = new EditorJSPackage({
          holder: editorRef.current,
          tools: {
            header: {
              class: Header,
              config: {
                levels: [1, 2, 3],
                defaultLevel: 1
              }
            },
            list: {
              class: List,
              inlineToolbar: true
            },
            checklist: {
              class: Checklist,
              inlineToolbar: true
            },
            quote: {
              class: Quote,
              inlineToolbar: true
            },
            code: {
              class: CodeTool,
              inlineToolbar: true
            },
            link: {
              class: LinkTool,
              config: {
                endpoint: '/api/fetchUrl'
              }
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile(file) {
                    // Implement file upload logic here
                    return Promise.resolve({
                      success: 1,
                      file: {
                        url: URL.createObjectURL(file)
                      }
                    });
                  }
                }
              }
            },
            table: {
              class: Table,
              inlineToolbar: true
            },
            marker: {
              class: Marker,
              inlineToolbar: true
            },
            inlineCode: {
              class: InlineCode,
              inlineToolbar: true
            }
          },
          data: data?.blocks ? data : { blocks: [] },
          onChange: async () => {
            try {
              const savedData = await editor.save();
              onChange?.({ 
                ...savedData, 
                title,
                lastModified: new Date().toISOString() 
              });
            } catch (err) {
              console.error('Failed to save editor data:', err);
            }
          },
          placeholder: 'Start writing your note...',
          inlineToolbar: true
        });

        editorInstance.current = editor;
      } catch (err) {
        console.error('Failed to initialize editor:', err);
      }
    };

    initEditor();
  }, [isReady, data?.blocks, onChange, title]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (editorInstance.current) {
      editorInstance.current.save().then(data => {
        onChange?.({ 
          ...data, 
          title: newTitle,
          lastModified: new Date().toISOString()
        });
      }).catch(err => {
        console.error('Failed to save title:', err);
      });
    }
  };

  if (!isReady) {
    return <div
      className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >Loading editor...</div>;
  }

  return (
    <div className={`min-h-screen pt-16 sm:pt-20 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className={`w-full px-3 sm:px-4 py-3 sm:py-4 mb-6 sm:mb-8 text-2xl sm:text-3xl font-serif border-none focus:outline-none focus:ring-0 ${
            theme === 'dark' 
              ? 'bg-gray-900 text-white placeholder-gray-500' 
              : 'bg-gray-50 text-gray-900 placeholder-gray-400'
          }`}
          placeholder="Note Title"
        />
        <div 
          ref={editorRef} 
          className={`editorjs prose prose-sm sm:prose ${
            theme === 'dark' 
              ? 'prose-invert bg-gray-900' 
              : 'prose-gray bg-gray-50'
          } max-w-none`}
        />
      </div>
    </div>
  );
}