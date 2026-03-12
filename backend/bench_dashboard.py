import os
import django
import time
from django.db import connection
from django.test.utils import CaptureQueriesContext

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from records.views import (
    DashboardNovedadesView, 
    DashboardHechosView, 
    DashboardRecordsView, 
    DashboardPersonnelView, 
    DashboardMapView
)

def benchmark_view(view_class, name, path='/api/dashboard/'):
    print(f"\nBenchmarking {name}...")
    factory = RequestFactory()
    request = factory.get(path)
    view = view_class.as_view()

    with CaptureQueriesContext(connection) as context:
        start_time = time.perf_counter()
        response = view(request)
        response.render()
        end_time = time.perf_counter()

    query_count = len(context.captured_queries)
    duration = end_time - start_time
    
    print(f"Status Code: {response.status_code}")
    print(f"Duration: {duration:.4f}s")
    print(f"Queries: {query_count}")
    
    # Optional: Print slow queries
    for q in context.captured_queries:
        if float(q['time']) > 0.01:
            print(f"Slow Query ({q['time']}s):")
            print(f"SQL: {q['sql']}")
            print("-" * 40)

if __name__ == "__main__":
    benchmark_view(DashboardNovedadesView, "DashboardNovedadesView")
    benchmark_view(DashboardHechosView, "DashboardHechosView")
    benchmark_view(DashboardRecordsView, "DashboardRecordsView")
    benchmark_view(DashboardPersonnelView, "DashboardPersonnelView")
    benchmark_view(DashboardMapView, "DashboardMapView", path='/api/dashboard/map/?scope=ba')
