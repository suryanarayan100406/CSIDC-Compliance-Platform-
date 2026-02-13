import { useState, useEffect } from 'react'
import { FileText, Download, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

const API = 'http://localhost:8000'

export default function ReportsPage() {
    const [analyses, setAnalyses] = useState([])

    useEffect(() => {
        fetchAnalyses()
    }, [])

    const fetchAnalyses = async () => {
        try {
            const res = await fetch(`${API}/api/analyses`)
            const data = await res.json()
            setAnalyses(data.analyses || [])
        } catch {
            setAnalyses([])
        }
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Reports & Analysis History</h2>
                    <p>View past analyses and generate compliance reports</p>
                </div>
            </header>

            <div className="page-body">
                {/* Quick Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                    <div className="stat-card animate-in">
                        <div className="stat-icon blue"><FileText size={20} /></div>
                        <div className="stat-value">{analyses.length}</div>
                        <div className="stat-label">Total Analyses</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon red"><AlertTriangle size={20} /></div>
                        <div className="stat-value">
                            {analyses.filter(a => a.summary?.risk_level === 'Critical' || a.summary?.risk_level === 'High').length}
                        </div>
                        <div className="stat-label">High Risk Findings</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon green"><CheckCircle size={20} /></div>
                        <div className="stat-value">
                            {analyses.filter(a => a.summary?.risk_level === 'Low').length}
                        </div>
                        <div className="stat-label">Low Risk</div>
                    </div>
                </div>

                {analyses.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <FileText size={64} />
                            <h3>No Analysis Reports Yet</h3>
                            <p>
                                Run your first image comparison analysis to generate reports.
                                Upload a reference allotment map and a current satellite image
                                on the "Analyze Images" page.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><Clock size={16} /> Analysis History</h3>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="plots-table">
                                <thead>
                                    <tr>
                                        <th>Report ID</th>
                                        <th>Reference File</th>
                                        <th>Current File</th>
                                        <th>Deviations</th>
                                        <th>Change %</th>
                                        <th>Risk Level</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyses.map(a => (
                                        <tr key={a.result_id}>
                                            <td style={{ fontWeight: 600 }}>{a.result_id}</td>
                                            <td>{a.reference_file || '—'}</td>
                                            <td>{a.current_file || '—'}</td>
                                            <td>{a.summary?.total_deviations ?? '—'}</td>
                                            <td>{a.summary?.change_percentage ?? '—'}%</td>
                                            <td>
                                                <span className={`badge badge-${(a.summary?.risk_level || 'low').toLowerCase()}`}>
                                                    {a.summary?.risk_level || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {a.analyzed_at ? new Date(a.analyzed_at).toLocaleString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
