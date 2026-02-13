import { useState, useEffect } from 'react'
import { Map, Search, Filter, ExternalLink } from 'lucide-react'

const API = 'http://localhost:8000'

export default function PlotsPage() {
    const [plots, setPlots] = useState([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchPlots()
    }, [])

    const fetchPlots = async () => {
        try {
            const res = await fetch(`${API}/api/plots`)
            const data = await res.json()
            setPlots(data.plots || [])
        } catch {
            setPlots([
                { id: "PLOT-001", name: "Siltara Industrial Area - Plot A1", status: "Compliant", area_sqm: 4500, lessee: "ABC Industries Pvt Ltd", allotment_date: "2019-03-15", last_inspection: "2025-11-20", lease_status: "Active", coordinates: [21.2854, 81.5880] },
                { id: "PLOT-002", name: "Siltara Industrial Area - Plot A2", status: "Encroachment Detected", area_sqm: 3200, lessee: "XYZ Manufacturing", allotment_date: "2020-06-01", last_inspection: "2025-10-15", lease_status: "Active", coordinates: [21.2860, 81.5890] },
                { id: "PLOT-003", name: "Urla Industrial Area - Plot B5", status: "Vacant/Unused", area_sqm: 6000, lessee: "PQR Steels", allotment_date: "2018-01-10", last_inspection: "2025-09-05", lease_status: "Dues Pending", coordinates: [21.2230, 81.5640] },
                { id: "PLOT-004", name: "Urla Industrial Area - Plot B6", status: "Boundary Deviation", area_sqm: 5100, lessee: "LMN Chemicals", allotment_date: "2017-08-22", last_inspection: "2025-12-01", lease_status: "Active", coordinates: [21.2240, 81.5650] },
                { id: "PLOT-005", name: "Borai Industrial Area - Plot C1", status: "Unauthorized Construction", area_sqm: 7500, lessee: "DEF Pharma Ltd", allotment_date: "2021-02-14", last_inspection: "2025-08-18", lease_status: "Active", coordinates: [21.3010, 81.6200] },
                { id: "PLOT-006", name: "Borai Industrial Area - Plot C2", status: "Compliant", area_sqm: 4000, lessee: "GHI Textiles", allotment_date: "2019-11-30", last_inspection: "2025-07-25", lease_status: "Active", coordinates: [21.3020, 81.6210] },
            ])
        }
    }

    const getStatusBadge = (status) => {
        if (status === 'Compliant') return 'badge-compliant'
        if (status.includes('Encroachment')) return 'badge-critical'
        if (status.includes('Vacant')) return 'badge-warning'
        if (status.includes('Boundary')) return 'badge-high'
        if (status.includes('Unauthorized')) return 'badge-critical'
        return 'badge-info'
    }

    const filteredPlots = plots.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase()) ||
            p.lessee?.toLowerCase().includes(search.toLowerCase())
        const matchFilter = filter === 'all' ||
            (filter === 'compliant' && p.status === 'Compliant') ||
            (filter === 'violations' && p.status !== 'Compliant')
        return matchSearch && matchFilter
    })

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Plot Registry</h2>
                    <p>Complete inventory of monitored industrial land parcels</p>
                </div>
                <a
                    href="https://cggis.cgstate.gov.in/csidc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                >
                    <ExternalLink size={16} /> CSIDC GIS Portal
                </a>
            </header>

            <div className="page-body">
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by Plot ID, area name, or lessee..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All Plots</option>
                        <option value="compliant">Compliant Only</option>
                        <option value="violations">Violations Only</option>
                    </select>
                </div>

                {/* Table */}
                <div className="card animate-in">
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="plots-table">
                            <thead>
                                <tr>
                                    <th>Plot ID</th>
                                    <th>Industrial Area / Plot</th>
                                    <th>Lessee</th>
                                    <th>Area (sqm)</th>
                                    <th>Allotment Date</th>
                                    <th>Last Inspection</th>
                                    <th>Lease Status</th>
                                    <th>Compliance Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlots.map(plot => (
                                    <tr key={plot.id}>
                                        <td style={{ fontWeight: 600 }}>{plot.id}</td>
                                        <td>{plot.name}</td>
                                        <td>{plot.lessee}</td>
                                        <td>{plot.area_sqm?.toLocaleString()}</td>
                                        <td>{plot.allotment_date || '—'}</td>
                                        <td>{plot.last_inspection || '—'}</td>
                                        <td>
                                            <span className={`badge ${plot.lease_status === 'Dues Pending' ? 'badge-warning' : 'badge-compliant'}`}>
                                                {plot.lease_status || 'Active'}
                                            </span>
                                        </td>
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
