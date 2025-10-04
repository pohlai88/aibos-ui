/**
 * File Upload Component - Enterprise Production Ready
 *
 * Drag and drop file upload component with semantic tokens, CVA variants,
 * and comprehensive accessibility features for enterprise file management.
 */

import { isPerfMode, varianceAttributes } from '../utils';
import { cn } from '../utils/cn.utility';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { UploadIcon, CloseIcon, CheckCircleIcon, AlertCircleIcon } from '../icons';

const fileUploadVariants = cva(
  'border-semantic-border bg-semantic-background text-semantic-foreground relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
  {
    variants: {
      variant: {
        default: 'hover:bg-semantic-muted/50',
        primary: 'border-semantic-primary hover:bg-semantic-primary/5',
        success: 'border-semantic-success hover:bg-semantic-success/5',
        warning: 'border-semantic-warning hover:bg-semantic-warning/5',
        error: 'border-semantic-error hover:bg-semantic-error/5',
      },
      size: {
        sm: 'min-h-[120px] p-4',
        md: 'min-h-[160px] p-6',
        lg: 'min-h-[200px] p-8',
      },
      state: {
        idle: '',
        dragOver: 'border-semantic-primary bg-semantic-primary/5',
        uploading: 'border-semantic-primary bg-semantic-primary/5',
        success: 'border-semantic-success bg-semantic-success/5',
        error: 'border-semantic-error bg-semantic-error/5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'idle',
    },
  },
);

const fileItemVariants = cva(
  'border-semantic-border bg-semantic-background text-semantic-foreground flex items-center gap-3 rounded-md border p-3',
  {
    variants: {
      status: {
        pending: 'border-semantic-border',
        uploading: 'border-semantic-primary',
        success: 'border-semantic-success',
        error: 'border-semantic-error',
      },
      size: {
        sm: 'p-2 text-sm',
        md: 'p-3 text-sm',
        lg: 'p-4 text-base',
      },
    },
    defaultVariants: {
      status: 'pending',
      size: 'md',
    },
  },
);

export interface FileUploadProperties
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onError' | 'onProgress' | 'onSuccess'>,
    VariantProps<typeof fileUploadVariants> {
  /**
   * Accepted file types
   */
  accept?: string;
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
  /**
   * Maximum number of files
   */
  maxFiles?: number;
  /**
   * Whether to allow multiple files
   */
  multiple?: boolean;
  /**
   * Upload URL endpoint
   */
  uploadUrl?: string;
  /**
   * Custom upload handler
   */
  onUpload?: (files: File[]) => Promise<void>;
  /**
   * File upload progress callback
   */
  onProgress?: (progress: number) => void;
  /**
   * File upload success callback
   */
  onSuccess?: (files: File[]) => void;
  /**
   * File upload error callback
   */
  onError?: (error: Error) => void;
  /**
   * Custom drag and drop text
   */
  dragText?: string;
  /**
   * Custom click to upload text
   */
  clickText?: string;
  /**
   * Whether to show file preview
   */
  showPreview?: boolean;
  /**
   * Whether to show file size
   */
  showFileSize?: boolean;
  /**
   * Whether to show upload progress
   */
  showProgress?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

const FileUpload = React.memo(
  React.forwardRef<HTMLInputElement, FileUploadProperties>(
    (
      {
        className,
        variant,
        size,
        state,
        accept,
        maxSize,
        maxFiles = 1,
        multiple = false,
        uploadUrl,
        onUpload,
        onProgress,
        onSuccess,
        onError,
        dragText = 'Drag and drop files here, or click to select',
        clickText = 'Click to upload',
        showPreview = true,
        showFileSize = true,
        showProgress = true,
        ...props
      },
      reference,
    ) => {
      const [files, setFiles] = React.useState<FileItem[]>([]);
      const [dragOver, setDragOver] = React.useState(false);
      const [isUploading, setIsUploading] = React.useState(false);
      const fileInputRef = React.useRef<HTMLInputElement>(null);

      const handleFiles = React.useCallback(
        (newFiles: File[]) => {
          const validFiles = newFiles.filter((file) => {
            if (maxSize && file.size > maxSize) {
              onError?.(new Error(`File ${file.name} is too large`));
              return false;
            }
            return true;
          });

          const fileItems: FileItem[] = validFiles.map((file) => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            status: 'pending' as const,
          }));

          setFiles((prev) => {
            const updated = [...prev, ...fileItems];
            return multiple ? updated : updated.slice(-maxFiles);
          });
        },
        [maxSize, maxFiles, multiple, onError],
      );

      const handleDragOver = React.useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(true);
      }, []);

      const handleDragLeave = React.useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);
      }, []);

      const handleDrop = React.useCallback(
        (event: React.DragEvent) => {
          event.preventDefault();
          setDragOver(false);
          const droppedFiles = Array.from(event.dataTransfer.files);
          handleFiles(droppedFiles);
        },
        [handleFiles],
      );

      const handleFileSelect = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const selectedFiles = Array.from(event.target.files || []);
          handleFiles(selectedFiles);
        },
        [handleFiles],
      );

      const handleUpload = React.useCallback(async () => {
        if (!files.length) return;

        setIsUploading(true);
        const filesToUpload = files.filter((f) => f.status === 'pending');

        try {
          if (onUpload) {
            await onUpload(filesToUpload.map((f) => f.file));
          } else if (uploadUrl) {
            // Default upload implementation
            const formData = new FormData();
            filesToUpload.forEach((item) => {
              formData.append('files', item.file);
            });

            const response = await globalThis.fetch(uploadUrl, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }
          }

          setFiles((prev) =>
            prev.map((file) => ({
              ...file,
              status: 'success' as const,
            })),
          );

          onSuccess?.(filesToUpload.map((f) => f.file));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setFiles((prev) =>
            prev.map((file) => ({
              ...file,
              status: 'error' as const,
              error: errorMessage,
            })),
          );
          onError?.(error instanceof Error ? error : new Error('Upload failed'));
        } finally {
          setIsUploading(false);
        }
      }, [files, onUpload, uploadUrl, onSuccess, onError]);

      const removeFile = React.useCallback((id: string) => {
        setFiles((prev) => prev.filter((file) => file.id !== id));
      }, []);

      const formatFileSize = React.useCallback((bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const sizeIndex = Math.min(i, sizes.length - 1); // Ensure index is within bounds
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[sizeIndex]; // eslint-disable-line security/detect-object-injection -- Safe array access with bounds checking
      }, []);

      const getFileIcon = React.useCallback((file: File) => {
        if (file.type.startsWith('image/')) return '🖼️';
        if (file.type.startsWith('video/')) return '🎥';
        if (file.type.startsWith('audio/')) return '🎵';
        if (file.type.includes('pdf')) return '📄';
        if (file.type.includes('word')) return '📝';
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
        return '📁';
      }, []);

      const currentState = React.useMemo(() => {
        if (dragOver) return 'dragOver';
        if (isUploading) return 'uploading';
        if (files.some((f) => f.status === 'error')) return 'error';
        if (files.some((f) => f.status === 'success')) return 'success';
        return 'idle';
      }, [dragOver, isUploading, files]);

      if (isPerfMode()) {
        return (
          <div
            ref={reference as React.Ref<HTMLDivElement>}
            className={cn(fileUploadVariants({ variant, size, state: currentState }), className)}
            {...varianceAttributes()}
              {...(props as Record<string, unknown>)}
          >
            <UploadIcon className="text-semantic-muted-foreground h-8 w-8" />
            <p className="text-semantic-muted-foreground text-sm">{dragText}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              className="hidden"
              {...props}
            />
          </div>
        );
      }

      return (
        <div className="w-full">
          <div
            className={cn(fileUploadVariants({ variant, size, state: currentState }), className)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="File upload area"
          >
            <UploadIcon className="text-semantic-muted-foreground h-8 w-8" />
            <p className="text-semantic-muted-foreground text-sm">{dragText}</p>
            <p className="text-semantic-muted-foreground text-xs">{clickText}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              className="hidden"
              onChange={handleFileSelect}
              {...props}
            />
          </div>

          {showPreview && files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={cn(fileItemVariants({ status: fileItem.status, size }))}
                >
                  <span className="text-lg">{getFileIcon(fileItem.file)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-semantic-foreground truncate font-medium">
                      {fileItem.file.name}
                    </p>
                    {showFileSize && (
                      <p className="text-semantic-muted-foreground text-xs">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    )}
                    {showProgress && fileItem.status === 'uploading' && fileItem.progress && (
                      <div className="bg-semantic-muted mt-1 h-2 w-full rounded-full">
                        <div
                          className="bg-semantic-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    )}
                    {fileItem.error && (
                      <p className="text-semantic-error mt-1 text-xs">{fileItem.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileItem.status === 'success' && (
                      <CheckCircleIcon className="text-semantic-success h-4 w-4" />
                    )}
                    {fileItem.status === 'error' && (
                      <AlertCircleIcon className="text-semantic-error h-4 w-4" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileItem.id);
                      }}
                      className="text-semantic-muted-foreground hover:text-semantic-error transition-colors"
                      aria-label={`Remove ${fileItem.file.name}`}
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleUpload}
                disabled={isUploading || files.every((f) => f.status !== 'pending')}
                className="bg-semantic-primary text-semantic-primary-foreground hover:bg-semantic-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
              <button
                onClick={() => setFiles([])}
                className="bg-semantic-secondary text-semantic-secondary-foreground hover:bg-semantic-secondary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      );
    },
  ),
);

FileUpload.displayName = 'FileUpload';

export { FileUpload, fileUploadVariants, fileItemVariants };
export type FileUploadReference = React.ElementRef<typeof FileUpload>;
export type FileUploadElement = React.ElementType;
