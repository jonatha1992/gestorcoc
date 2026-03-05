import requests, json

def test_pagination():
    url = "http://localhost:8000/api/novedades/"
    try:
        response = requests.get(url)
        data = response.json()
        print(f"Status Code: {response.status_code}")
        if 'results' in data and 'count' in data:
            print("Pagination: ENABLED")
            print(f"Total Count: {data['count']}")
            print(f"Page Size: {len(data['results'])}")
        else:
            print("Pagination: DISABLED (Plain list returned)")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    test_pagination()
