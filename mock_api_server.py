"""
MaBiS Time Series API - Mock Server für Demo-Zwecke

Dieser Mock-Server implementiert die MaBiS API für lokale Tests und Demos.
Er speichert Daten im Speicher (nicht persistent) und führt echte Formelberechnungen durch.

Verwendung:
    python mock_api_server.py

    Server läuft auf: http://localhost:5000
"""

from __future__ import annotations

from flask import Flask, request, jsonify
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import uuid
import json
from decimal import Decimal

app = Flask(__name__)

# In-Memory Speicher
time_series_store: Dict[str, Dict[str, Any]] = {}
formula_store: Dict[str, Dict[str, Any]] = {}
calculation_store: Dict[str, Dict[str, Any]] = {}

# Mock OAuth2 Tokens
valid_tokens = set()


# ==================== HELPER FUNCTIONS ====================

def generate_id(prefix: str) -> str:
    """Generate unique ID"""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def validate_token(auth_header: Optional[str]) -> bool:
    """Validate Bearer token"""
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.replace('Bearer ', '')
    # For demo: accept any token that looks like a token
    return len(token) > 10


def calculate_formula(formula: Dict[str, Any], input_data: Dict[str, List[Dict]]) -> List[Dict]:
    """
    Execute formula calculation on input time series data

    Args:
        formula: Formula definition
        input_data: Dictionary mapping time series IDs to their interval data

    Returns:
        List of calculated intervals
    """
    expression = formula['expression']
    function_name = expression['function']
    parameters = expression['parameters']

    # Get first input time series to determine number of intervals
    first_ts_id = list(input_data.keys())[0]
    num_intervals = len(input_data[first_ts_id])

    result_intervals = []

    for i in range(num_intervals):
        # Calculate value for this interval
        calculated_value = execute_expression(expression, input_data, i)

        # Use timestamp from first input series
        first_interval = input_data[first_ts_id][i]

        result_intervals.append({
            'position': i + 1,
            'start': first_interval['start'],
            'end': first_interval['end'],
            'quantity': f"{calculated_value:.3f}",
            'quality': 'VALIDATED'
        })

    return result_intervals


def execute_expression(expr: Dict[str, Any], input_data: Dict[str, List[Dict]], interval_idx: int) -> float:
    """Execute a formula expression for a specific interval"""
    function_name = expr['function']
    parameters = expr['parameters']

    if function_name == 'Wenn_Dann':
        # If-Then-Else logic
        line_a = get_parameter_value(parameters[0], input_data, interval_idx)
        comparator = parameters[1]['value']
        line_b = get_parameter_value(parameters[2], input_data, interval_idx)
        then_value = get_parameter_value(parameters[3], input_data, interval_idx)
        else_value = get_parameter_value(parameters[4], input_data, interval_idx)

        if comparator == '>':
            return then_value if line_a > line_b else else_value
        elif comparator == '<':
            return then_value if line_a < line_b else else_value
        elif comparator == '>=':
            return then_value if line_a >= line_b else else_value
        elif comparator == '<=':
            return then_value if line_a <= line_b else else_value
        elif comparator == '==':
            return then_value if line_a == line_b else else_value
        else:
            return else_value

    elif function_name == 'Grp_Sum':
        # Sum multiple time series with optional scaling factors
        total = 0.0
        for param in parameters:
            value = get_parameter_value(param, input_data, interval_idx)
            total += value
        return total

    elif function_name == 'Anteil_Groesser_Als':
        # Portion above threshold
        zeitreihe_id = parameters[0]['value']
        threshold = parameters[1]['value']

        if zeitreihe_id in input_data:
            value = float(input_data[zeitreihe_id][interval_idx]['quantity'])
            return value if value > threshold else 0.0
        return 0.0

    elif function_name == 'Anteil_Kleiner_Als':
        # Portion below threshold
        zeitreihe_id = parameters[0]['value']
        threshold = parameters[1]['value']

        if zeitreihe_id in input_data:
            value = float(input_data[zeitreihe_id][interval_idx]['quantity'])
            return value if value < threshold else 0.0
        return 0.0

    elif function_name == 'Quer_Max':
        # Maximum across series
        values = [get_parameter_value(param, input_data, interval_idx) for param in parameters]
        return max(values) if values else 0.0

    elif function_name == 'Quer_Min':
        # Minimum across series
        values = [get_parameter_value(param, input_data, interval_idx) for param in parameters]
        return min(values) if values else 0.0

    else:
        # Default: return 0
        return 0.0


def get_parameter_value(param: Dict[str, Any], input_data: Dict[str, List[Dict]], interval_idx: int) -> float:
    """Get parameter value for calculation"""
    param_type = param.get('type', 'constant')

    if param_type == 'constant':
        return float(param['value'])

    elif param_type == 'timeseries_ref':
        ts_id = param['value']
        if ts_id in input_data and interval_idx < len(input_data[ts_id]):
            value = float(input_data[ts_id][interval_idx]['quantity'])
            # Apply scaling factor if present
            scaling_factor = param.get('scalingFactor', 1.0)
            return value * scaling_factor
        return 0.0

    elif param_type == 'expression':
        # Nested expression
        return execute_expression(param['value'], input_data, interval_idx)

    elif param_type == 'string':
        # String values (like comparators) are handled separately
        return 0.0

    else:
        return 0.0


# ==================== OAUTH2 ENDPOINTS ====================

@app.route('/oauth/token', methods=['POST'])
def oauth_token():
    """Mock OAuth2 token endpoint"""
    grant_type = request.form.get('grant_type')
    client_id = request.form.get('client_id')
    client_secret = request.form.get('client_secret')

    if grant_type != 'client_credentials':
        return jsonify({'error': 'unsupported_grant_type'}), 400

    if not client_id or not client_secret:
        return jsonify({'error': 'invalid_client'}), 401

    # Generate mock token
    token = f"mock_token_{uuid.uuid4().hex}"
    valid_tokens.add(token)

    return jsonify({
        'access_token': token,
        'token_type': 'Bearer',
        'expires_in': 3600,
        'scope': request.form.get('scope', 'timeseries.read timeseries.write formulas.read formulas.write calculations.read calculations.execute')
    })


# ==================== TIME SERIES ENDPOINTS ====================

@app.route('/v1/time-series', methods=['POST'])
def submit_time_series():
    """Submit time series data"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    message_id = data.get('messageId')
    time_series_list = data.get('timeSeries', [])

    accepted_ids = []
    for ts in time_series_list:
        ts_id = ts['timeSeriesId']
        time_series_store[ts_id] = ts
        accepted_ids.append(ts_id)

    return jsonify({
        'messageId': message_id,
        'acceptanceTime': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'status': 'ACCEPTED',
        'timeSeriesIds': accepted_ids
    }), 201


@app.route('/v1/time-series', methods=['GET'])
def query_time_series():
    """Query time series data"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    # Simple filtering by marketLocationId
    market_location_id = request.args.get('marketLocationId')

    results = []
    for ts_id, ts_data in time_series_store.items():
        if not market_location_id or ts_data.get('marketLocationId') == market_location_id:
            results.append(ts_data)

    return jsonify({
        'timeSeries': results,
        'pagination': {
            'pageSize': len(results),
            'nextPageToken': None,
            'totalCount': len(results)
        }
    })


@app.route('/v1/time-series/<time_series_id>', methods=['GET'])
def get_time_series(time_series_id):
    """Get specific time series"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    if time_series_id not in time_series_store:
        return jsonify({'error': 'Not found'}), 404

    return jsonify(time_series_store[time_series_id])


# ==================== FORMULA ENDPOINTS ====================

@app.route('/v1/formulas', methods=['POST'])
def submit_formula():
    """Submit formula definition"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    message_id = data.get('messageId')
    formulas = data.get('formulas', [])

    accepted_ids = []
    for formula in formulas:
        formula_id = formula['formulaId']
        formula_store[formula_id] = formula
        accepted_ids.append(formula_id)

    return jsonify({
        'messageId': message_id,
        'acceptanceTime': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'status': 'ACCEPTED',
        'formulaIds': accepted_ids,
        'validationResults': [
            {'formulaId': fid, 'valid': True} for fid in accepted_ids
        ]
    }), 201


@app.route('/v1/formulas', methods=['GET'])
def list_formulas():
    """List all formulas"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    formulas = list(formula_store.values())

    return jsonify({
        'formulas': formulas,
        'totalCount': len(formulas),
        'nextCursor': None
    })


@app.route('/v1/formulas/<formula_id>', methods=['GET'])
def get_formula(formula_id):
    """Get specific formula"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    if formula_id not in formula_store:
        return jsonify({'error': 'Not found'}), 404

    return jsonify(formula_store[formula_id])


# ==================== CALCULATION ENDPOINTS ====================

@app.route('/v1/calculations', methods=['POST'])
def execute_calculation():
    """Execute calculation"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    calculation_id = data.get('calculationId')
    formula_id = data.get('formulaId')
    input_ts_map = data.get('inputTimeSeries', {})
    period = data.get('period', {})
    output_ts_id = data.get('outputTimeSeriesId')

    # Get formula
    if formula_id not in formula_store:
        return jsonify({
            'type': 'https://api.mabis-hub.de/problems/not-found',
            'title': 'Formula Not Found',
            'status': 404,
            'detail': f'Formula {formula_id} not found'
        }), 404

    formula = formula_store[formula_id]

    # Get input time series data
    input_data = {}
    for param_name, ts_id in input_ts_map.items():
        if ts_id not in time_series_store:
            return jsonify({
                'type': 'https://api.mabis-hub.de/problems/not-found',
                'title': 'Time Series Not Found',
                'status': 404,
                'detail': f'Time series {ts_id} not found'
            }), 404

        ts_data = time_series_store[ts_id]
        input_data[param_name] = ts_data['intervals']

    # Store calculation as pending
    calculation_store[calculation_id] = {
        'calculationId': calculation_id,
        'formulaId': formula_id,
        'status': 'PENDING',
        'acceptedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }

    # Execute calculation
    try:
        result_intervals = calculate_formula(formula, input_data)

        # Create output time series
        if not output_ts_id:
            output_ts_id = generate_id('TS-CALC')

        output_ts = {
            'timeSeriesId': output_ts_id,
            'marketLocationId': list(time_series_store.values())[0].get('marketLocationId', 'CALCULATED'),
            'measurementType': formula.get('outputUnit', 'KWH'),
            'unit': formula.get('outputUnit', 'KWH'),
            'resolution': formula.get('outputResolution', 'PT15M'),
            'period': period,
            'intervals': result_intervals,
            'metadata': {
                'calculatedBy': formula_id,
                'calculationId': calculation_id,
                'formulaName': formula.get('name'),
                'calculatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
        }

        time_series_store[output_ts_id] = output_ts

        # Update calculation status
        calculation_store[calculation_id].update({
            'status': 'COMPLETED',
            'outputTimeSeriesId': output_ts_id,
            'completedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        })

    except Exception as e:
        calculation_store[calculation_id].update({
            'status': 'FAILED',
            'errors': [{'code': 'CALCULATION_ERROR', 'message': str(e)}]
        })

    return jsonify({
        'calculationId': calculation_id,
        'status': calculation_store[calculation_id]['status'],
        'acceptedAt': calculation_store[calculation_id]['acceptedAt']
    }), 202


@app.route('/v1/calculations/<calculation_id>', methods=['GET'])
def get_calculation(calculation_id):
    """Get calculation result"""
    if not validate_token(request.headers.get('Authorization')):
        return jsonify({'error': 'Unauthorized'}), 401

    if calculation_id not in calculation_store:
        return jsonify({'error': 'Not found'}), 404

    return jsonify(calculation_store[calculation_id])


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'stats': {
            'time_series': len(time_series_store),
            'formulas': len(formula_store),
            'calculations': len(calculation_store)
        }
    })


@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API info"""
    return jsonify({
        'name': 'MaBiS Time Series API - Mock Server',
        'version': '1.0.0',
        'description': 'Demo-Server für MaBiS Zeitreihen und Formel-API',
        'endpoints': {
            'oauth': '/oauth/token',
            'time-series': '/v1/time-series',
            'formulas': '/v1/formulas',
            'calculations': '/v1/calculations',
            'health': '/health'
        },
        'documentation': 'See README.md and mabis-timeseries-api.yaml'
    })


if __name__ == '__main__':
    print("=" * 60)
    print("MaBiS Time Series API - Mock Server")
    print("=" * 60)
    print()
    print("Server startet auf: http://localhost:8000")
    print()
    print("Verfügbare Endpunkte:")
    print("  POST   /oauth/token           - OAuth2 Token abrufen")
    print("  POST   /v1/time-series        - Zeitreihen übermitteln")
    print("  GET    /v1/time-series        - Zeitreihen abfragen")
    print("  GET    /v1/time-series/{id}   - Bestimmte Zeitreihe abrufen")
    print("  POST   /v1/formulas           - Formel übermitteln")
    print("  GET    /v1/formulas           - Formeln auflisten")
    print("  GET    /v1/formulas/{id}      - Bestimmte Formel abrufen")
    print("  POST   /v1/calculations       - Berechnung ausführen")
    print("  GET    /v1/calculations/{id}  - Berechnungsergebnis abrufen")
    print("  GET    /health                - Health Check")
    print()
    print("Test mit: python demo_client.py")
    print("=" * 60)
    print()

    app.run(debug=True, host='0.0.0.0', port=8000)
