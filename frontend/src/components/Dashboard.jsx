import { useState, useEffect } from 'react'
import {
    MapPin,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Building,
    Eye,
    Satellite,
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'
import MapView from './MapView'

const API = 'http://localhost:8000'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function Dashboard({ onNavigate }) {
    const [stats, setStats] = useState(null)
    const [plots, setPlots] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [statsRes, plotsRes] = await Promise.all([
                fetch(`${API}/api/dashboard/stats`),
                fetch(`${API}/api/plots`),
            ])
            const statsData = await statsRes.json()
            const plotsData = await plotsRes.json()
            setStats(statsData)
            setPlots(plotsData.plots || [])
        } catch (err) {
            // Fallback demo data if backend is not running
            setStats({
                total_plots: 6,
                compliant: 2,
                violations_detected: 4,
                encroachments: 1,
                vacant_plots: 1,
                boundary_deviations: 1,
                unauthorized_construction: 1,
                pending_dues: 1,
                total_analyses: 0,
            })
            setPlots([
                { id: "PLOT-001", name: "Siltara Industrial Area - Plot A1", status: "Compliant", area_sqm: 4500, lessee: "ABC Industries Pvt Ltd", coordinates: [21.2854, 81.5880] },
                { id: "PLOT-002", name: "Siltara Industrial Area - Plot A2", status: "Encroachment Detected", area_sqm: 3200, lessee: "XYZ Manufacturing", coordinates: [21.2860, 81.5890] },
                { id: "PLOT-003", name: "Urla Industrial Area - Plot B5", status: "Vacant/Unused", area_sqm: 6000, lessee: "PQR Steels", coordinates: [21.2230, 81.5640] },
                { id: "PLOT-004", name: "Urla Industrial Area - Plot B6", status: "Boundary Deviation", area_sqm: 5100, lessee: "LMN Chemicals", coordinates: [21.2240, 81.5650] },
                { id: "PLOT-005", name: "Borai Industrial Area - Plot C1", status: "Unauthorized Construction", area_sqm: 7500, lessee: "DEF Pharma Ltd", coordinates: [21.3010, 81.6200] },
                { id: "PLOT-006", name: "Borai Industrial Area - Plot C2", status: "Compliant", area_sqm: 4000, lessee: "GHI Textiles", coordinates: [21.3020, 81.6210] },
            ])
        }
    }

    const pieData = stats ? [
        { name: 'Compliant', value: stats.compliant },
        { name: 'Encroachment', value: stats.encroachments },
        { name: 'Vacant', value: stats.vacant_plots },
        { name: 'Boundary Issues', value: stats.boundary_deviations },
        { name: 'Unauthorized', value: stats.unauthorized_construction },
    ].filter(d => d.value > 0) : []

    const barData = [
        { area: 'Siltara', compliant: 1, violations: 1 },
        { area: 'Urla', compliant: 0, violations: 2 },
        { area: 'Borai', compliant: 1, violations: 1 },
    ]

    const getStatusBadge = (status) => {
        if (status === 'Compliant') return 'badge-compliant'
        if (status.includes('Encroachment')) return 'badge-critical'
        if (status.includes('Vacant')) return 'badge-warning'
        if (status.includes('Boundary')) return 'badge-high'
        if (status.includes('Unauthorized')) return 'badge-critical'
        return 'badge-info'
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>CSIDC Industrial Land Monitoring Overview</p>
                </div>
                <div className="header-actions">
                    <div className="header-badge">
                        <span className="pulse-dot"></span>
                        System Active
                    </div>
                    <button className="btn btn-primary" onClick={() => onNavigate('analyze')}>
                        <Satellite size={16} /> New Analysis
                    </button>
                </div>
            </header>

            <div className="page-body">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card animate-in">
                        <div className="stat-icon blue"><MapPin size={20} /></div>
                        <div className="stat-value">{stats?.total_plots || 0}</div>
                        <div className="stat-label">Total Plots Monitored</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon green"><CheckCircle size={20} /></div>
                        <div className="stat-value">{stats?.compliant || 0}</div>
                        <div className="stat-label">Compliant Plots</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon red"><AlertTriangle size={20} /></div>
                        <div className="stat-value">{stats?.violations_detected || 0}</div>
                        <div className="stat-label">Violations Detected</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon amber"><Building size={20} /></div>
                        <div className="stat-value">{stats?.unauthorized_construction || 0}</div>
                        <div className="stat-label">Unauthorized Construction</div>
                    </div>
                </div>

                {/* Map & Charts */}
                <div className="content-grid">
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><MapPin size={16} /> Industrial Areas Map</h3>
                        </div>
                        <div className="card-body">
                            <div className="map-container">
                                <MapView plots={plots} />
                            </div>
                        </div>
                    </div>

                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><TrendingUp size={16} /> Compliance Overview</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: '20px', height: '360px' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Status Distribution</p>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                        {pieData.map((d, i) => (
                                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }}></span>
                                                {d.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>By Industrial Area</p>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                                            <Bar dataKey="compliant" fill="#10b981" radius={[4, 4, 0, 0]} name="Compliant" />
                                            <Bar dataKey="violations" fill="#ef4444" radius={[4, 4, 0, 0]} name="Violations" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Plots */}
                <div className="card animate-in">
                    <div className="card-header">
                        <h3><Eye size={16} /> Plot Registry</h3>
                        <button className="btn btn-secondary" onClick={() => onNavigate('plots')}>
                            View All
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="plots-table">
                            <thead>
                                <tr>
                                    <th>Plot ID</th>
                                    <th>Industrial Area</th>
                                    <th>Lessee</th>
                                    <th>Area (sqm)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plots.map(plot => (
                                    <tr key={plot.id}>
                                        <td style={{ fontWeight: 600 }}>{plot.id}</td>
                                        <td>{plot.name}</td>
                                        <td>{plot.lessee}</td>
                                        <td>{plot.area_sqm?.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(plot.status)}`}>
                                                {plot.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}
