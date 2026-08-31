import React, { useState } from 'react';
import {
  History,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Ban,
} from 'lucide-react';
import { useBell } from '../context/BellContext';
import { BellLog } from '../types';

export const BellHistoryView: React.FC = () => {
  const { logs, clearLogs } = useBell();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'ALL') return true;
    return log.status === filterStatus;
  });

  const getStatusBadge = (status: BellLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'MANUAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800">
            <Radio className="w-3 h-3" />
            <span>MANUAL</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800">
            <Ban className="w-3 h-3" />
            <span>SKIPPED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date', 'Time (WIB)', 'Event Name', 'Audio Name', 'Status', 'Reason'];
    const rows = logs.map((l) => [
      l.dateFormatted,
      l.wibTime,
      `"${l.eventName.replace(/"/g, '""')}"`,
      `"${l.audioName.replace(/"/g, '""')}"`,
      l.status,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pags-bell-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#112240] p-5 rounded-2xl border border-blue-900/30 shadow-lg">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Execution Audit</div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <History className="w-5 h-5 text-blue-400" />
            <span>BELL ACTIVITY HISTORY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit telemetry of automatic timetable strikes and manual override events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="px-3.5 py-2 bg-[#0a192f] hover:bg-blue-900/40 text-slate-200 font-bold text-xs rounded-xl border border-blue-900/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all bell activity logs?')) {
                clearLogs();
              }
            }}
            disabled={logs.length === 0}
            className="px-3.5 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap mr-1">Status Filter:</span>
        {['ALL', 'SUCCESS', 'MANUAL', 'SKIPPED', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === st
                ? 'bg-blue-600 text-white shadow-md border border-blue-400/20'
                : 'bg-[#112240] text-slate-400 hover:bg-white/5 border border-blue-900/40'
            }`}
          >
            {st} ({st === 'ALL' ? logs.length : logs.filter((l) => l.status === st).length})
          </button>
        ))}
      </div>

      {/* History Table */}
      <div className="bg-[#112240] border border-blue-900/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#001b3a] border-b border-blue-900/50 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <th className="py-3 px-5">DATE & TIME (WIB)</th>
                <th className="py-3 px-5">EVENT NAME</th>
                <th className="py-3 px-5">AUDIO TRACK</th>
                <th className="py-3 px-5 text-center">STATUS</th>
                <th className="py-3 px-5">TELEMETRY DETAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/20 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No bell activity records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-900/20 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-300">
                      <div className="font-bold text-white">{log.wibTime} WIB</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{log.dateFormatted}</div>
                    </td>

                    <td className="py-3.5 px-5 font-bold text-white">
                      {log.eventName}
                    </td>

                    <td className="py-3.5 px-5 text-xs text-blue-300 font-mono">
                      {log.audioName}
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      {getStatusBadge(log.status)}
                    </td>

                    <td className="py-3.5 px-5 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.reason || (log.status === 'SUCCESS' ? 'Bell broadcast completed according to timetable' : '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
