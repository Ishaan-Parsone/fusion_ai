from django.http import JsonResponse
from rest_framework.decorators import api_view
import os
from PIL import Image
import numpy as np
from ultralytics import YOLO

# Define the absolute path to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'vision', 'models')

# Load the pretrained and fine-tuned models
pretrained_model_path = os.path.join(MODEL_DIR, "yolov8n.pt")
custom_model_path = os.path.join(MODEL_DIR, "best.pt")

pretrained_model = YOLO(pretrained_model_path)  # Pretrained YOLOv8 model
custom_model = YOLO(custom_model_path)  # Your fine-tuned model

def process_image(image_file):
    """
    Convert uploaded image to a format YOLOv8 supports.
    """
    try:
        # Convert image to RGB format using PIL
        image = Image.open(image_file).convert("RGB")
        # Convert PIL Image to NumPy array
        image = np.array(image)
        return image
    except Exception as e:
        return None, str(e)

@api_view(["POST"])
def predict_pretrained(request):
    """
    Runs object detection using the pretrained YOLOv8 model (`yolov8n.pt`).
    """
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image provided"}, status=400)
    
    image_file = request.FILES["image"]
    image = process_image(image_file)
    if image is None:
        return JsonResponse({"error": "Invalid image format"}, status=400)
    
    # Get privacy level and analysis type
    privacy_level = request.POST.get("privacy_level", "high")
    analysis_type = request.POST.get("analysis_type", "object")
    debug = request.POST.get("debug", "false").lower() == "true"
    
    # Run inference using the pretrained model
    results = pretrained_model.predict(image)
    
    detections = []
    console_output = ""
    
    for r in results:
        # Extract console output for debug mode
        if debug:
            console_output = str(r)
            
        for box in r.boxes:
            class_id = int(box.cls)
            # Get class name directly from the model's names dictionary
            class_name = pretrained_model.names[class_id]
            
            detections.append({
                "class": class_id,
                "name": class_name,  # This gets the name directly from the model
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()
            })
    
    response_data = {"detections": detections}
    
    # Include debug info if requested
    if debug:
        response_data["consoleOutput"] = console_output
    
    return JsonResponse(response_data)

@api_view(["POST"])
def predict_custom(request):
    """
    Runs object detection using the fine-tuned model (`best.pt`).
    """
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image provided"}, status=400)

    image_file = request.FILES["image"]
    image = process_image(image_file)

    if image is None:
        return JsonResponse({"error": "Invalid image format"}, status=400)

    # Run inference using the fine-tuned model
    results = custom_model.predict(image)

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": int(box.cls), 
                "confidence": float(box.conf), 
                "bbox": box.xyxy.tolist()
            })

    return JsonResponse({"detections": detections})
