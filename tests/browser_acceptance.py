"""Compatibility entrypoint for the Studio acceptance suite. Set STUDIO_URL for HTTP E2E."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("studio_browser.py")),run_name="__main__")
