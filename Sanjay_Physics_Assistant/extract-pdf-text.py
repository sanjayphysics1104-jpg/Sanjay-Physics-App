import json
import sys

from pypdf import PdfReader


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    reader = PdfReader(sys.argv[1], strict=False)
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text(extraction_mode="layout") or "")
        except Exception:
            pages.append(page.extract_text() or "")
    json.dump(pages, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
