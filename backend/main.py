from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime

from image_processing import read_image_from_bytes, compute_difference

app = FastAPI(
    title="Land Monitoring System API",
    description="Automated monitoring for industrial land allotments",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for analyses (MVP - no database needed)
analyses_store = {}

# Sample demo data for initial dashboard
DEMO_PLOTS = [
    {
        "id": "PLOT-001",
        "name": "Siltara Industrial Area - Plot A1",
        "status": "Compliant",
        "area_sqm": 4500,
        "lessee": "ABC Industries Pvt Ltd",
        "allotment_date": "2019-03-15",
        "last_inspection": "2025-11-20",
        "lease_status": "Active",
        "coordinates": [21.2854, 81.5880],
    },
    {
        "id": "PLOT-002",
        "name": "Siltara Industrial Area - Plot A2",
        "status": "Encroachment Detected",
        "area_sqm": 3200,
        "lessee": "XYZ Manufacturing",
        "allotment_date": "2020-06-01",
        "last_inspection": "2025-10-15",
        "lease_status": "Active",
        "coordinates": [21.2860, 81.5890],
    },
    {
        "id": "PLOT-003",
        "name": "Urla Industrial Area - Plot B5",
        "status": "Vacant/Unused",
        "area_sqm": 6000,
        "lessee": "PQR Steels",
        "allotment_date": "2018-01-10",
        "last_inspection": "2025-09-05",
        "lease_status": "Dues Pending",
        "coordinates": [21.2230, 81.5640],
    },
    {
        "id": "PLOT-004",
        "name": "Urla Industrial Area - Plot B6",
        "status": "Boundary Deviation",
        "area_sqm": 5100,
        "lessee": "LMN Chemicals",
        "allotment_date": "2017-08-22",
        "last_inspection": "2025-12-01",
        "lease_status": "Active",
        "coordinates": [21.2240, 81.5650],
    },
    {
        "id": "PLOT-005",
        "name": "Borai Industrial Area - Plot C1",
        "status": "Unauthorized Construction",
        "area_sqm": 7500,
        "lessee": "DEF Pharma Ltd",
        "allotment_date": "2021-02-14",
        "last_inspection": "2025-08-18",
        "lease_status": "Active",
        "coordinates": [21.3010, 81.6200],
    },
    {
        "id": "PLOT-006",
        "name": "Borai Industrial Area - Plot C2",
        "status": "Compliant",
        "area_sqm": 4000,
        "lessee": "GHI Textiles",
        "allotment_date": "2019-11-30",
        "last_inspection": "2025-07-25",
        "lease_status": "Active",
        "coordinates": [21.3020, 81.6210],
    },
]


@app.get("/")
async def root():
    return {"message": "Land Monitoring System API", "version": "1.0.0"}


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get overview statistics for the dashboard."""
    statuses = [p["status"] for p in DEMO_PLOTS]
    return {
        "total_plots": len(DEMO_PLOTS),
        "compliant": statuses.count("Compliant"),
        "violations_detected": len([s for s in statuses if s != "Compliant"]),
        "encroachments": statuses.count("Encroachment Detected"),
        "vacant_plots": statuses.count("Vacant/Unused"),
        "boundary_deviations": statuses.count("Boundary Deviation"),
        "unauthorized_construction": statuses.count("Unauthorized Construction"),
        "pending_dues": len([p for p in DEMO_PLOTS if p["lease_status"] == "Dues Pending"]),
        "total_analyses": len(analyses_store),
        "last_updated": datetime.now().isoformat(),
    }


@app.get("/api/plots")
async def get_plots():
    """Get all plots data."""
    return {"plots": DEMO_PLOTS}


@app.get("/api/plots/{plot_id}")
async def get_plot(plot_id: str):
    """Get a specific plot by ID."""
    for plot in DEMO_PLOTS:
        if plot["id"] == plot_id:
            return plot
    raise HTTPException(status_code=404, detail="Plot not found")


@app.post("/api/analyze")
async def analyze_images(
    reference: UploadFile = File(..., description="Reference/allotment map image (JPG/PNG)"),
    current: UploadFile = File(..., description="Current satellite/drone image (JPG/PNG)")
):
    """
    Upload a reference map and a current satellite image.
    Returns the analysis results with detected deviations.
    """
    # Validate file types
    allowed = ["image/jpeg", "image/png", "image/jpg"]
    if reference.content_type not in allowed or current.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Only JPG/PNG images are supported (matching CSIDC GIS portal export formats)"
        )

    try:
        ref_bytes = await reference.read()
        cur_bytes = await current.read()

        ref_img = read_image_from_bytes(ref_bytes)
        cur_img = read_image_from_bytes(cur_bytes)

        if ref_img is None or cur_img is None:
            raise HTTPException(status_code=400, detail="Could not decode one or both images")

        # Run the analysis
        results = compute_difference(ref_img, cur_img)

        # Add metadata
        results["metadata"] = {
            "reference_filename": reference.filename,
            "current_filename": current.filename,
            "analyzed_at": datetime.now().isoformat(),
            "reference_dimensions": f"{ref_img.shape[1]}x{ref_img.shape[0]}",
            "current_dimensions": f"{cur_img.shape[1]}x{cur_img.shape[0]}",
        }

        # Store result
        analyses_store[results["result_id"]] = results

        return JSONResponse(content=results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/analyses")
async def list_analyses():
    """List all past analyses."""
    summaries = []
    for rid, data in analyses_store.items():
        summaries.append({
            "result_id": rid,
            "analyzed_at": data.get("metadata", {}).get("analyzed_at"),
            "summary": data.get("summary"),
            "reference_file": data.get("metadata", {}).get("reference_filename"),
            "current_file": data.get("metadata", {}).get("current_filename"),
        })
    return {"analyses": summaries}


@app.get("/api/analyses/{result_id}")
async def get_analysis(result_id: str):
    """Get a specific analysis result."""
    if result_id not in analyses_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analyses_store[result_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
