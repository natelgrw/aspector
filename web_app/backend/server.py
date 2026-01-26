import os
import json
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

# Import conversion scripts
# Ensure these files are in the same directory
from net_to_graph import NetlistToGraph
from graph_to_json import reconstruct_circuit, convert_to_serializable

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):
    """
    Uploads a .scs file, converts it to a graph,
    and returns the graph data for visualization and JSON download.
    """
    if not file.filename.endswith(".scs"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .scs file.")

    # Create a temporary directory to save the uploaded file
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Initialize converter
        converter = NetlistToGraph()
        
        try:
            # Convert to graph
            graph_data = converter.parse_file(temp_file_path)
            
            # Convert to JSON structure
            structured_data = reconstruct_circuit(graph_data)

            # Prepare response
            # We return the structured data which contains:
            # - metadata (with perf_specs)
            # - components
            # - nets
            
            # We also might want to return stats separately if easy access is needed, 
            # but structured_data['metadata'] has them.
            
            # Debug print to stderr (visible in docker logs)
            import sys
            try:
                # Test serialization first
                json.dumps(convert_to_serializable(structured_data))
            except Exception as ser_err:
                print(f"Serialization Check Failed: {ser_err}", file=sys.stderr)
                # Inspect structured_data
                for k, v in structured_data.items():
                    print(f"Key: {k}, Type: {type(v)}", file=sys.stderr)
                    if isinstance(v, dict):
                         for sk, sv in v.items():
                            print(f"  SubKey: {sk}, Type: {type(sv)}", file=sys.stderr)
                raise ser_err

            return JSONResponse(content=convert_to_serializable(structured_data))
            
        except Exception as e:
            # Print stack trace for debugging
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
