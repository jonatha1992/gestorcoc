
import pandas as pd
import json

def extract_unique_values(file_path, sheet_name):
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    unique_data = {}
    for column in df.columns:
        if column.startswith('Unnamed'): continue
        unique_data[column] = sorted([str(x) for x in df[column].dropna().unique()])
        
    return unique_data

if __name__ == "__main__":
    file_path = r'c:\Repositorio\equipamiento\LIBRO DE REGISTROS FILMICOS 22-09-2025(Recuperado automáticamente).xlsm'
    sheet_name = 'VD'
    try:
        data = extract_unique_values(file_path, sheet_name)
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}")
