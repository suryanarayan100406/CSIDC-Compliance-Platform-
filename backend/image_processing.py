import cv2
import numpy as np
from PIL import Image
import io
import base64
import uuid
import os

UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def read_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    """Convert uploaded file bytes to OpenCV image."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def resize_to_match(img1: np.ndarray, img2: np.ndarray) -> tuple:
    """Resize img2 to match img1's dimensions."""
    h, w = img1.shape[:2]
    img2_resized = cv2.resize(img2, (w, h), interpolation=cv2.INTER_AREA)
    return img1, img2_resized


def compute_difference(reference: np.ndarray, current: np.ndarray) -> dict:
    """
    Compare reference map with current satellite image.
    Returns difference analysis with highlighted regions.
    """
    # Ensure same size
    reference, current = resize_to_match(reference, current)

    # Convert to grayscale
    ref_gray = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    cur_gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    ref_blur = cv2.GaussianBlur(ref_gray, (5, 5), 0)
    cur_blur = cv2.GaussianBlur(cur_gray, (5, 5), 0)

    # Compute absolute difference
    diff = cv2.absdiff(ref_blur, cur_blur)

    # Threshold to get binary mask of significant changes
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # Morphological operations to clean up noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

    # Find contours of changed regions
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter small contours (noise)
    min_area = 500
    significant_contours = [c for c in contours if cv2.contourArea(c) > min_area]

    # Create visualization images
    # 1. Overlay image - current image with changes highlighted in red
    overlay = current.copy()
    change_mask = np.zeros_like(cur_gray)
    cv2.drawContours(change_mask, significant_contours, -1, 255, -1)
    overlay[change_mask > 0] = [0, 0, 255]  # Red overlay on changes

    # 2. Side-by-side with bounding boxes
    annotated_ref = reference.copy()
    annotated_cur = current.copy()

    deviation_regions = []
    for i, contour in enumerate(significant_contours):
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        cv2.rectangle(annotated_cur, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.rectangle(annotated_ref, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(annotated_cur, f"D{i+1}", (x, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        # Classify the deviation
        deviation_type = classify_deviation(reference, current, contour, x, y, w, h)

        deviation_regions.append({
            "id": f"D{i+1}",
            "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "area_pixels": int(area),
            "type": deviation_type,
            "severity": classify_severity(area, reference.shape[0] * reference.shape[1])
        })

    # 3. Heatmap of changes
    heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
    heatmap_blend = cv2.addWeighted(current, 0.6, heatmap, 0.4, 0)

    # Calculate statistics
    total_area = reference.shape[0] * reference.shape[1]
    changed_area = np.sum(change_mask > 0)
    change_percentage = (changed_area / total_area) * 100

    # Encode images to base64 for frontend
    result_id = str(uuid.uuid4())[:8]

    results = {
        "result_id": result_id,
        "summary": {
            "total_deviations": len(significant_contours),
            "change_percentage": round(change_percentage, 2),
            "total_area_pixels": int(total_area),
            "changed_area_pixels": int(changed_area),
            "risk_level": get_risk_level(change_percentage, len(significant_contours)),
        },
        "deviations": deviation_regions,
        "images": {
            "overlay": encode_image(overlay),
            "annotated_current": encode_image(annotated_cur),
            "annotated_reference": encode_image(annotated_ref),
            "heatmap": encode_image(heatmap_blend),
            "difference": encode_image(cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)),
        }
    }

    return results


def classify_deviation(ref, cur, contour, x, y, w, h):
    """Classify the type of deviation detected."""
    roi_ref = ref[y:y+h, x:x+w]
    roi_cur = cur[y:y+h, x:x+w]

    # Check if area was empty in reference (possible encroachment)
    ref_gray = cv2.cvtColor(roi_ref, cv2.COLOR_BGR2GRAY) if len(roi_ref.shape) == 3 else roi_ref
    cur_gray = cv2.cvtColor(roi_cur, cv2.COLOR_BGR2GRAY) if len(roi_cur.shape) == 3 else roi_cur

    ref_mean = np.mean(ref_gray)
    cur_mean = np.mean(cur_gray)

    ref_std = np.std(ref_gray)
    cur_std = np.std(cur_gray)

    if ref_mean > 180 and cur_mean < 150:
        return "Possible Encroachment/Construction"
    elif ref_mean < 150 and cur_mean > 180:
        return "Possible Demolition/Vacant"
    elif cur_std > ref_std * 1.5:
        return "Unauthorized Development"
    elif abs(ref_mean - cur_mean) > 50:
        return "Land Use Change"
    else:
        return "Boundary Deviation"


def classify_severity(area, total_area):
    """Classify the severity of a deviation."""
    ratio = area / total_area
    if ratio > 0.05:
        return "Critical"
    elif ratio > 0.02:
        return "High"
    elif ratio > 0.01:
        return "Medium"
    else:
        return "Low"


def get_risk_level(change_pct, num_deviations):
    """Overall risk assessment."""
    if change_pct > 15 or num_deviations > 10:
        return "Critical"
    elif change_pct > 8 or num_deviations > 5:
        return "High"
    elif change_pct > 3 or num_deviations > 2:
        return "Medium"
    else:
        return "Low"


def encode_image(img: np.ndarray) -> str:
    """Encode OpenCV image to base64 string."""
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return base64.b64encode(buffer).decode('utf-8')
