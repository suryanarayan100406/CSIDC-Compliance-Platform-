import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Upload,
    Image,
    Zap,
    AlertTriangle,
    CheckCircle,
    Layers,
    Flame,
    Eye,
    X,
} from 'lucide-react'

const API = 'http://localhost:8000'

export default function AnalyzePage() {
    const [referenceFile, setReferenceFile] = useState(null)
    const [currentFile, setCurrentFile] = useState(null)
    const [referencePreview, setReferencePreview] = useState(null)
    const [currentPreview, setCurrentPreview] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [results, setResults] = useState(null)
    const [activeTab, setActiveTab] = useState('overlay')
    const [error, setError] = useState(null)

    const onDropReference = useCallback((files) => {
        if (files[0]) {
            setReferenceFile(files[0])
            setReferencePreview(URL.createObjectURL(files[0]))
            setResults(null)
            setError(null)
        }
    }, [])

    const onDropCurrent = useCallback((files) => {
        if (files[0]) {
            setCurrentFile(files[0])
            setCurrentPreview(URL.createObjectURL(files[0]))
            setResults(null)
            setError(null)
        }
    }, [])

    const refDropzone = useDropzone({
        onDrop: onDropReference,
        accept: { 'image/jpeg': [], 'image/png': [] },
        multiple: false,
    })

    const curDropzone = useDropzone({
        onDrop: onDropCurrent,
        accept: { 'image/jpeg': [], 'image/png': [] },
        multiple: false,
    })

    const runAnalysis = async () => {
        if (!referenceFile || !currentFile) return
        setAnalyzing(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('reference', referenceFile)
            formData.append('current', currentFile)

            const res = await fetch(`${API}/api/analyze`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.detail || 'Analysis failed')
            }

            const data = await res.json()
            setResults(data)
        } catch (err) {
            setError(err.message || 'Failed to connect to the server. Make sure the backend is running on port 8000.')
        } finally {
            setAnalyzing(false)
        }
    }

    const resetAll = () => {
        setReferenceFile(null)
        setCurrentFile(null)
        setReferencePreview(null)
        setCurrentPreview(null)
        setResults(null)
        setError(null)
    }

    const riskColors = {
        Critical: 'var(--accent-red)',
        High: 'var(--accent-amber)',
        Medium: 'var(--accent-purple)',
        Low: 'var(--accent-green)',
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Image Analysis</h2>
                    <p>Compare reference allotment maps with current satellite/drone imagery</p>
                </div>
                {results && (
                    <button className="btn btn-secondary" onClick={resetAll}>
                        <X size={16} /> New Analysis
                    </button>
                )}
            </header>

            <div className="page-body">
                {!results ? (
                    <>
                        {/* Upload Section */}
                        <div className="upload-row">
                            <div className="card animate-in">
                                <div className="card-header">
                                    <h3><Image size={16} /> Reference Map (Allotment / Base Map)</h3>
                                </div>
                                <div className="card-body">
                                    <div
                                        {...refDropzone.getRootProps()}
                                        className={`upload-zone ${refDropzone.isDragActive ? 'active' : ''}`}
                                    >
                                        <input {...refDropzone.getInputProps()} />
                                        <div className="upload-icon"><Upload size={28} /></div>
                                        <h4>Upload Reference Map</h4>
                                        <p>Drag & Drop or click to select JPG/PNG from CSIDC GIS portal</p>
                                    </div>
                                    {referencePreview && (
                                        <div className="upload-preview">
                                            <img src={referencePreview} alt="Reference" />
                                            <div className="file-info">
                                                <span>{referenceFile.name}</span>
                                                <span>{(referenceFile.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card animate-in">
                                <div className="card-header">
                                    <h3><Layers size={16} /> Current Image (Satellite / Drone)</h3>
                                </div>
                                <div className="card-body">
                                    <div
                                        {...curDropzone.getRootProps()}
                                        className={`upload-zone ${curDropzone.isDragActive ? 'active' : ''}`}
                                    >
                                        <input {...curDropzone.getInputProps()} />
                                        <div className="upload-icon"><Upload size={28} /></div>
                                        <h4>Upload Current Image</h4>
                                        <p>Drag & Drop or click to select satellite/drone JPG/PNG</p>
                                    </div>
                                    {currentPreview && (
                                        <div className="upload-preview">
                                            <img src={currentPreview} alt="Current" />
                                            <div className="file-info">
                                                <span>{currentFile.name}</span>
                                                <span>{(currentFile.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="risk-meter critical" style={{ marginBottom: 20 }}>
                                <AlertTriangle size={20} style={{ color: 'var(--accent-red)' }} />
                                <div>
                                    <div className="risk-label" style={{ color: 'var(--accent-red)' }}>Error</div>
                                    <div className="risk-desc">{error}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={runAnalysis}
                                disabled={!referenceFile || !currentFile || analyzing}
                                style={{ padding: '14px 40px', fontSize: '15px' }}
                            >
                                {analyzing ? (
                                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Analyzing...</>
                                ) : (
                                    <><Zap size={18} /> Run Change Detection Analysis</>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Results Section */}
                        <div className={`risk-meter ${results.summary.risk_level.toLowerCase()} animate-in`}>
                            <AlertTriangle size={22} style={{ color: riskColors[results.summary.risk_level] }} />
                            <div>
                                <div className="risk-label" style={{ color: riskColors[results.summary.risk_level] }}>
                                    Risk Level: {results.summary.risk_level}
                                </div>
                                <div className="risk-desc">
                                    {results.summary.total_deviations} deviation(s) detected · {results.summary.change_percentage}% area changed
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
                            <div className="stat-card animate-in">
                                <div className="stat-icon red"><AlertTriangle size={18} /></div>
                                <div className="stat-value">{results.summary.total_deviations}</div>
                                <div className="stat-label">Deviations Found</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon amber"><Flame size={18} /></div>
                                <div className="stat-value">{results.summary.change_percentage}%</div>
                                <div className="stat-label">Area Changed</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon blue"><Eye size={18} /></div>
                                <div className="stat-value">{results.summary.changed_area_pixels?.toLocaleString()}</div>
                                <div className="stat-label">Changed Pixels</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon green"><CheckCircle size={18} /></div>
                                <div className="stat-value">
                                    {(100 - results.summary.change_percentage).toFixed(1)}%
                                </div>
                                <div className="stat-label">Unchanged Area</div>
                            </div>
                        </div>

                        {/* Image Results Tabs */}
                        <div className="card animate-in" style={{ marginBottom: 24 }}>
                            <div className="card-header">
                                <h3><Layers size={16} /> Visual Analysis Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="tabs">
                                    {['overlay', 'heatmap', 'difference', 'annotated'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab === 'overlay' && 'Change Overlay'}
                                            {tab === 'heatmap' && 'Heatmap'}
                                            {tab === 'difference' && 'Binary Diff'}
                                            {tab === 'annotated' && 'Annotated'}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'overlay' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.overlay}`} alt="Overlay" />
                                        <div className="result-image-label">
                                            <Eye size={14} /> Red regions show detected changes between reference and current image
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'heatmap' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.heatmap}`} alt="Heatmap" />
                                        <div className="result-image-label">
                                            <Flame size={14} /> Heat intensity shows magnitude of change (blue=low, red=high)
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'difference' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.difference}`} alt="Difference" />
                                        <div className="result-image-label">
                                            <Layers size={14} /> Binary mask of significant changes after noise filtering
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'annotated' && (
                                    <div className="results-grid">
                                        <div className="result-image-container">
                                            <img src={`data:image/jpeg;base64,${results.images.annotated_reference}`} alt="Annotated Reference" />
                                            <div className="result-image-label">
                                                <Image size={14} /> Reference Map (with deviation regions)
                                            </div>
                                        </div>
                                        <div className="result-image-container">
                                            <img src={`data:image/jpeg;base64,${results.images.annotated_current}`} alt="Annotated Current" />
                                            <div className="result-image-label">
                                                <Image size={14} /> Current Image (with deviation regions)
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deviations Table */}
                        {results.deviations.length > 0 && (
                            <div className="card animate-in">
                                <div className="card-header">
                                    <h3><AlertTriangle size={16} /> Detected Deviations</h3>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    <table className="deviation-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Type</th>
                                                <th>Severity</th>
                                                <th>Area (px)</th>
                                                <th>Location</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.deviations.map(dev => (
                                                <tr key={dev.id}>
                                                    <td style={{ fontWeight: 600 }}>{dev.id}</td>
                                                    <td>{dev.type}</td>
                                                    <td>
                                                        <span className={`badge badge-${dev.severity.toLowerCase()}`}>
                                                            {dev.severity}
                                                        </span>
                                                    </td>
                                                    <td>{dev.area_pixels?.toLocaleString()}</td>
                                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        ({dev.bbox.x}, {dev.bbox.y}) - {dev.bbox.width}×{dev.bbox.height}
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info" style={{ cursor: 'pointer' }}>
                                                            Flag for Review
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
