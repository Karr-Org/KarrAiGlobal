#!/usr/bin/env python3
"""
PDF Text Extraction Script
Uses pdfplumber for reliable text extraction from PDFs.

Usage: python extract_pdf.py <pdf_path>
Output: Extracted text to stdout
"""

import sys
import os

def extract_text(pdf_path):
    """Extract text from PDF using pdfplumber (preferred) or PyPDF2 (fallback)."""
    
    # Try pdfplumber first (best for complex PDFs)
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        if text_parts:
            return '\n\n'.join(text_parts)
    except ImportError:
        pass  # pdfplumber not installed
    except Exception as e:
        print(f"pdfplumber error: {e}", file=sys.stderr)

    # Fallback to PyPDF2
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(pdf_path)
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        if text_parts:
            return '\n\n'.join(text_parts)
    except ImportError:
        pass  # PyPDF2 not installed
    except Exception as e:
        print(f"PyPDF2 error: {e}", file=sys.stderr)

    # Fallback to pdfminer.six
    try:
        from pdfminer.high_level import extract_text as pdfminer_extract
        text = pdfminer_extract(pdf_path)
        if text and text.strip():
            return text
    except ImportError:
        pass  # pdfminer not installed
    except Exception as e:
        print(f"pdfminer error: {e}", file=sys.stderr)

    return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    text = extract_text(pdf_path)
    
    if text:
        print(text)
        sys.exit(0)
    else:
        print("No text extracted", file=sys.stderr)
        sys.exit(1)
