#!/usr/bin/env python3
import sys, pathlib

def sort_imports_in_file(path: pathlib.Path) -> bool:
    text = path.read_text()
    lines = text.splitlines()
    start = None
    end = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import "):
            if start is None:
                start = i
            end = i
        elif start is not None and not stripped.startswith("import "):
            # end of import block
            break
    if start is None:
        return False  # no import statements
    import_lines = lines[start:end+1]
    sorted_imports = sorted(import_lines, key=lambda s: s.strip())
    new_lines = lines[:start] + sorted_imports + lines[end+1:]
    new_text = "\n".join(new_lines) + "\n"
    if new_text != text:
        path.write_text(new_text)
        return True
    return False

def main():
    root = pathlib.Path(".")
    changed = 0
    for path in root.rglob("*.java"):
        if sort_imports_in_file(path):
            changed += 1
            print(f"Sorted imports in {path}")
    print(f"Total files updated: {changed}")

if __name__ == "__main__":
    main()
