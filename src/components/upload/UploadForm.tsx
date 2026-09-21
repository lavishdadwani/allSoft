import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useUploadDocument, type RecentUpload } from '@/hooks/useUploadDocument'
import { useRecentUploads } from '@/hooks/useRecentUploads'
import { TagInput } from '@/components/common/TagInput'
import { isoToApiDate } from '@/lib/date'
import { getErrorMessage } from '@/lib/errors'
import {
  ACCEPTED_FILE_TYPES,
  MAJOR_HEADS,
  minorHeadOptions,
  uploadFileSchema,
  uploadFormSchema,
  type MajorHead,
} from '@/types/document'

interface FormState {
  documentDate: string
  majorHead: MajorHead | ''
  minorHead: string
  tags: string[]
  remarks: string
}

const INITIAL_STATE: FormState = {
  documentDate: '',
  majorHead: '',
  minorHead: '',
  tags: [],
  remarks: '',
}

export function UploadForm() {
  const { userId } = useAuth()
  const { showToast } = useToast()
  const uploadMutation = useUploadDocument()
  const recentUploads = useRecentUploads()

  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const minorOptions = useMemo(() => minorHeadOptions(form.majorHead), [form.majorHead])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm(INITIAL_STATE)
    setFile(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const fileResult = uploadFileSchema.safeParse(file)
    if (!fileResult.success) {
      setErrors((prev) => ({ ...prev, file: fileResult.error.issues[0]?.message ?? 'Invalid file' }))
      return
    }

    const metaResult = uploadFormSchema.safeParse({
      major_head: form.majorHead,
      minor_head: form.minorHead,
      document_date: isoToApiDate(form.documentDate),
      document_remarks: form.remarks,
      tags: form.tags.map((tag_name) => ({ tag_name })),
      user_id: userId ?? '',
    })

    if (!metaResult.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of metaResult.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    uploadMutation.mutate(
      { file: fileResult.data, meta: metaResult.data },
      {
        onSuccess: () => {
          showToast('Document uploaded successfully.', 'success')
          resetForm()
        },
        onError: (error) => {
          showToast(getErrorMessage(error, 'Upload failed. Please try again.'), 'error')
        },
      },
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-slate-900">Upload a document</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="upload-document-date" className="block text-sm font-medium text-slate-700 mb-1">
              Document date
            </label>
            <input
              id="upload-document-date"
              type="date"
              value={form.documentDate}
              onChange={(e) => updateField('documentDate', e.target.value)}
              className={inputClass(errors.document_date)}
            />
            {errors.document_date && <FieldError message={errors.document_date} />}
          </div>

          <div>
            <label htmlFor="upload-major-head" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="upload-major-head"
              value={form.majorHead}
              onChange={(e) => {
                updateField('majorHead', e.target.value as MajorHead)
                updateField('minorHead', '')
              }}
              className={inputClass(errors.major_head)}
            >
              <option value="">Select category</option>
              {MAJOR_HEADS.map((head) => (
                <option key={head} value={head}>
                  {head}
                </option>
              ))}
            </select>
            {errors.major_head && <FieldError message={errors.major_head} />}
          </div>

          <div>
            <label htmlFor="upload-minor-head" className="block text-sm font-medium text-slate-700 mb-1">
              {form.majorHead === 'Professional' ? 'Department' : 'Name'}
            </label>
            <select
              id="upload-minor-head"
              value={form.minorHead}
              onChange={(e) => updateField('minorHead', e.target.value)}
              disabled={!form.majorHead}
              className={inputClass(errors.minor_head)}
            >
              <option value="">
                {form.majorHead ? 'Select an option' : 'Select a category first'}
              </option>
              {minorOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.minor_head && <FieldError message={errors.minor_head} />}
          </div>

          <div>
            <label htmlFor="upload-file" className="block text-sm font-medium text-slate-700 mb-1">
              File (PDF or image)
            </label>
            <input
              id="upload-file"
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100"
            />
            {errors.file && <FieldError message={errors.file} />}
          </div>
        </div>

        <div>
          <label htmlFor="upload-tags" className="block text-sm font-medium text-slate-700 mb-1">
            Tags
          </label>
          <TagInput id="upload-tags" value={form.tags} onChange={(tags) => updateField('tags', tags)} />
        </div>

        <div>
          <label htmlFor="upload-remarks" className="block text-sm font-medium text-slate-700 mb-1">
            Remarks
          </label>
          <textarea
            id="upload-remarks"
            value={form.remarks}
            onChange={(e) => updateField('remarks', e.target.value)}
            rows={3}
            className={inputClass(errors.document_remarks)}
          />
          {errors.document_remarks && <FieldError message={errors.document_remarks} />}
        </div>

        <button
          type="submit"
          disabled={uploadMutation.isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {uploadMutation.isPending ? 'Uploading…' : 'Upload document'}
        </button>
      </form>

      <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent uploads</h3>
        {recentUploads.length === 0 && (
          <p className="text-xs text-slate-400">Uploads you make this session will show up here.</p>
        )}
        <ul className="space-y-2">
          {recentUploads.map((upload) => (
            <li key={upload.clientId} className="text-xs border border-slate-100 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 truncate">{upload.fileName}</span>
                <StatusBadge status={upload.status} />
              </div>
              <p className="text-slate-500 mt-0.5">
                {upload.majorHead} · {upload.minorHead}
              </p>
              {upload.tags.length > 0 && (
                <p className="text-slate-400 mt-0.5 truncate">#{upload.tags.join(' #')}</p>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

function StatusBadge({ status }: { status: RecentUpload['status'] }) {
  const styles: Record<RecentUpload['status'], string> = {
    pending: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded-full font-medium ${styles[status]}`}>{status}</span>
  )
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-600 mt-1">{message}</p>
}

function inputClass(error?: string) {
  return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
    error ? 'border-red-400' : 'border-slate-300'
  }`
}
