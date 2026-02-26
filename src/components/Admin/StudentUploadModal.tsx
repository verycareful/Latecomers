import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBulkAddStudents, parseCSVToStudents, parseExcelToStudents, type StudentInput } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/Shared';
import { cn } from '@/utils/helpers';

interface StudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentUploadModal({ isOpen, onClose }: StudentUploadModalProps) {
  const [students, setStudents] = useState<StudentInput[]>([]);
  const showCardColumn = students.some(s => s.card_id != null && s.card_id !== '');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const bulkAddStudents = useBulkAddStudents();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);

    try {
      let parsedStudents: StudentInput[];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsedStudents = parseCSVToStudents(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedStudents = await parseExcelToStudents(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      if (parsedStudents.length === 0) {
        throw new Error('No valid student records found in the file.');
      }

      setStudents(parsedStudents);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse file');
      setStudents([]);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (students.length === 0) return;
    
    try {
      await bulkAddStudents.mutateAsync(students);
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setStudents([]);
    setParseError(null);
    onClose();
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Students
            </h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              )}
            >
              <input {...getInputProps()} />
              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 dark:text-gray-400">Parsing file...</p>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive ? (
                      'Drop the file here...'
                    ) : (
                      <>
                        Drag and drop a CSV or Excel file, or{' '}
                        <span className="text-primary-600 dark:text-primary-400">browse</span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Supported formats: .csv, .xlsx, .xls
                  </p>
                </>
              )}
            </div>

            {/* Template Info */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Required Columns
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                register_number, name, course, batch, department, specialization, section (optional card_id)
              </p>
            </div>

            {/* Error */}
            {parseError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{parseError}</p>
              </div>
            )}

            {/* Preview */}
            {students.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Preview ({students.length} students)
                  </h3>
                  <button
                    onClick={() => setStudents([])}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Reg. No.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Dept</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Batch</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Sec</th>
                        {showCardColumn && (
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Card ID</th>
                        )}
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {students.slice(0, 50).map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {student.register_number}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">{student.name}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{student.department}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{student.batch}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{student.section}</td>
                          {showCardColumn && (
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs">
                              {student.card_id || ''}
                            </td>
                          )}
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeStudent(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length > 50 && (
                    <p className="text-center py-2 text-xs text-gray-500 dark:text-gray-400">
                      Showing first 50 of {students.length} students
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={students.length === 0 || bulkAddStudents.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {bulkAddStudents.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload {students.length} Students
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
