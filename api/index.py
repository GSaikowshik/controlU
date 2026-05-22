import sys
import os

# Add the backend directory to python path so we can import 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
