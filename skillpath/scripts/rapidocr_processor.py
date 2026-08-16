import sys
import json
import base64
import tempfile
import os

def process_pdf(pdf_bytes):
    try:
        from rapidocr_onnxruntime import RapidOCR
        engine = RapidOCR()
    except Exception as e:
        print(json.dumps({"success": False, "error": f"RapidOCR engine init failed: {str(e)}"}))
        return

    # Write PDF bytes to temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        # Check if rapidocr_pdf is available for PDF rendering
        extracted_text = []
        try:
            from rapidocr_pdf import PDFOCR
            pdf_ocr = PDFOCR()
            result, _ = pdf_ocr(tmp_path)
            if result:
                for page_res in result:
                    if page_res:
                        for box, txt, score in page_res:
                            extracted_text.append(txt)
        except Exception:
            # Fallback to direct RapidOCR image processing if pypdfium2 / rapidocr_pdf is not present
            result, _ = engine(tmp_path)
            if result:
                for line in result:
                    if len(line) >= 2:
                        extracted_text.append(line[1])

        full_text = " ".join(extracted_text).strip()
        confidence = 95 if len(full_text) > 100 else 60

        print(json.dumps({
            "success": True,
            "text": full_text,
            "confidence": confidence,
            "engine": "RapidOCR-ONNX"
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Read from file path passed as argument
        pdf_file = sys.argv[1]
        with open(pdf_file, "rb") as f:
            process_pdf(f.read())
    else:
        # Read base64 input from stdin
        stdin_data = sys.stdin.read().strip()
        if stdin_data:
            pdf_bytes = base64.b64decode(stdin_data)
            process_pdf(pdf_bytes)
        else:
            print(json.dumps({"success": False, "error": "No input PDF data provided"}))
