import sys
from pathlib import Path

# Make scripts/ importable from all tests
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
