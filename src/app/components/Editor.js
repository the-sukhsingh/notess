'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { FiGlobe } from 'react-icons/fi';

// Dynamically import Editor.js and its tools with no SSR
const EditorJS = dynamic(() => import('@editorjs/editorjs'), { 
  ssr: false,
  loading: () => <div className="text-gray-600 dark:text-gray-300">Loading editor...</div>
});

// Add DragDrop tool import
const DragDrop = dynamic(() => import('editorjs-drag-drop'), { ssr: false });

export default function Editor({ onChange, data }) {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [title, setTitle] = useState(data?.title || 'New Note');
  const [isReady, setIsReady] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
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
        const Quote = (await import('@editorjs/quote')).default;
        const CodeTool = (await import('@editorjs/code')).default;
        const LinkTool = (await import('@editorjs/link')).default;
        const ImageTool = (await import('@editorjs/image')).default;
        const Table = (await import('@editorjs/table')).default;
        const Marker = (await import('@editorjs/marker')).default;
        const InlineCode = (await import('@editorjs/inline-code')).default;
        const DragDropTool = (await import('editorjs-drag-drop')).default;

        const editor = new EditorJSPackage({
          holder: editorRef.current,
          tools: {
            header: {
              class: Header,
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 1
              }
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile(file) {
                    return Promise.resolve({
                      success: 1,
                      file: {
                        url: URL.createObjectURL(file)
                      }
                    });
                  },
                  uploadByUrl(url) {
                    return Promise.resolve({
                      success: 1,
                      file: {
                        url: url
                      }
                    });
                  }
                }
              }
            },
            list: {
              class: List,
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
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: '/api/fetchUrl'
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
          inlineToolbar: true,
          onReady: () => {
            new DragDropTool(editor);
          }
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

  const handleScrapeWebsite = async () => {
    const url = window.prompt('Enter the website URL to scrape:');
    if (!url) return;

    setIsScraping(true);
    try {
      const response = await fetch(`/api/fetchUrl?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape website');
      }

      // Update title if no title set yet
      if (title === 'New Note') {
        setTitle(data.meta.title);
      }

      // Convert scraped content to EditorJS blocks
      const blocks = [];

      // Add source link
      blocks.push({
        type: 'header',
        data: {
          text: 'Source',
          level: 4
        }
      });
      blocks.push({
        type: 'paragraph',
        data: {
          text: `<a href="${data.link}" target="_blank" rel="noopener noreferrer">${data.link}</a>`
        }
      });

      // Add description if available
      if (data.meta.description) {
        blocks.push({
          type: 'paragraph',
          data: {
            text: data.meta.description
          }
        });
      }

      // Add main content blocks
      for (const item of data.content) {
        if (item.type === 'image') {
          blocks.push({
            type: 'image',
            data: {
              file: {
                url: item.src
              },
              withBorder: false,
              withBackground: false,
              stretched: false
            }
          });
        } else if (item.type.startsWith('h')) {
          blocks.push({
            type: 'header',
            data: {
              text: item.text,
              level: parseInt(item.type.charAt(1))
            }
          });
        } else if (item.type === 'link'){
          blocks.push({
            type: 'linkTool',
            data: {
              link: item.href,
              meta: {
                title: item.text,
                description: item.description || '',
                image: {
                  url: item.image || ''
                }
              }

            }
          });
        
        } else if (item.type === 'email') {
          blocks.push({
            type: 'paragraph',
            data: {
              text: `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.text}</a>`
            }
          });
        } else {
          blocks.push({
            type: 'paragraph',
            data: {
              text: item.text
            }
          });
        }
      }

      // Update editor content
      await editorInstance.current.clear();
      await editorInstance.current.render({ blocks });
      
      // Trigger onChange to save the changes
      onChange?.({
        blocks,
        title: data.meta.title || title,
        lastModified: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error scraping website:', error);
      window.alert('Failed to scrape website: ' + error.message);
    } finally {
      setIsScraping(false);
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
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className={`flex-1 px-3 sm:px-4 py-3 sm:py-4 text-2xl sm:text-3xl font-serif border-none focus:outline-none focus:ring-0 ${
              theme === 'dark' 
                ? 'bg-gray-900 text-white placeholder-gray-500' 
                : 'bg-gray-50 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Note Title"
          />
          <button
            onClick={handleScrapeWebsite}
            disabled={isScraping}
            className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } transition-colors duration-200 shadow-sm ${isScraping ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiGlobe className="w-5 h-5" />
            <span className="hidden sm:inline">{isScraping ? 'Scraping...' : 'Scrape Website'}</span>
          </button>
        </div>
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