import os
import re

api_dir = 'app/api'
route_pattern = re.compile(r'route\.ts$')

affected_files = []

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if route_pattern.search(file):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line in lines:
                        if 'params:' in line and '{' in line and 'Promise' not in line:
                            if 'export async function' in line:
                                affected_files.append((path, line.strip()))
            except Exception as e:
                pass

if not affected_files:
    print("Found 0 affected files.")
else:
    print(f"Found {len(affected_files)} affected files:")
    for f, line in affected_files:
        print(f"{f}: {line}")
