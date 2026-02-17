import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStockIntegrityReport,
  reconcileAllStock,
} from '@/server/maintenance'
import { AlertCircle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export function StockIntegrityAlert() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const { data: issues, isLoading } = useQuery({
    queryKey: ['stock-integrity'],
    queryFn: () => getStockIntegrityReport(),
    refetchInterval: 1000 * 60 * 60 * 24, // 24 hours
    staleTime: 1000 * 60 * 60 * 24, // Consider data fresh for 24 hours
  })

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileAllStock(),
    onSuccess: (data) => {
      toast.success(`Successfully reconciled ${data.fixedCount} products`)
      queryClient.invalidateQueries({ queryKey: ['stock-integrity'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      setExpanded(false)
    },
    onError: () => {
      toast.error('Reconciliation failed')
    },
  })

  if (isLoading || !issues || issues.length === 0) return null

  return (
    <div className="rounded-lg border bg-amber-50 border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 p-3 text-sm text-amber-900">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <span className="font-semibold">Stock Drift Detected:</span>{' '}
          {issues.length} product{issues.length !== 1 ? 's' : ''}{' '}
          {issues.length !== 1 ? 'have' : 'has'} shelf counts that do not match
          the ledger history.
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 hover:bg-amber-100 text-amber-900"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-white border-amber-300 hover:bg-amber-100 text-amber-900 flex items-center gap-2 h-8"
          onClick={() => reconcileMutation.mutate()}
          disabled={reconcileMutation.isPending}
        >
          <RefreshCcw
            className={`h-3 w-3 ${reconcileMutation.isPending ? 'animate-spin' : ''}`}
          />
          Reconcile All
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-amber-200 bg-white/50">
          <div className="p-3 max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-left border-b border-amber-200">
                <tr>
                  <th className="pb-2 font-semibold text-amber-900">
                    Product Code
                  </th>
                  <th className="pb-2 font-semibold text-amber-900">
                    Product Name
                  </th>
                  <th className="pb-2 font-semibold text-amber-900 text-right">
                    Shelf Count
                  </th>
                  <th className="pb-2 font-semibold text-amber-900 text-right">
                    Ledger Total
                  </th>
                  <th className="pb-2 font-semibold text-amber-900 text-right">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-amber-50/50">
                    <td className="py-2 font-mono text-amber-800">
                      {issue.code}
                    </td>
                    <td className="py-2 text-amber-900">{issue.name}</td>
                    <td className="py-2 text-right font-mono text-amber-800">
                      {issue.shelf}
                    </td>
                    <td className="py-2 text-right font-mono text-green-700">
                      {issue.ledger}
                    </td>
                    <td
                      className={`py-2 text-right font-mono font-semibold ${issue.diff > 0 ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {issue.diff > 0 ? '+' : ''}
                      {issue.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
