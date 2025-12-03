"""
MaBiS Time Series API - Python Client Example

This example demonstrates how to interact with the MaBiS Time Series REST API
to submit metering values (equivalent to UTILTS EDIFACT messages) and
to submit and execute calculation formulas on time series data.
"""

import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass, asdict, field
from decimal import Decimal
from enum import Enum


@dataclass
class MarketParticipant:
    id: str  # EDIFACT ID (GLN)
    role: str  # MSB, NB, LF, BKV, BA, MV
    name: str = None


@dataclass
class Interval:
    position: int
    start: str  # ISO 8601 timestamp
    end: str
    quantity: str  # Decimal as string
    quality: str  # METERED, ESTIMATED, SUBSTITUTE, etc.
    status: str = "CONFIRMED"


@dataclass
class TimeSeries:
    timeSeriesId: str
    marketLocationId: str
    measurementType: str  # CONSUMPTION, GENERATION, etc.
    unit: str  # KWH, MWH
    resolution: str  # PT15M, PT1H, P1D
    period: Dict[str, str]
    intervals: List[Dict[str, Any]]
    meteringPointId: str = None
    metadata: Dict[str, Any] = None


@dataclass
class TimeSeriesSubmission:
    messageId: str
    messageDate: str
    sender: MarketParticipant
    receiver: MarketParticipant
    timeSeries: List[TimeSeries]


# ==================== FORMULA SUPPORT DATA CLASSES ====================

class FormulaFunction(str, Enum):
    """Enumeration of supported formula functions"""
    ANTEIL_GROESSER_ALS = "Anteil_Groesser_Als"
    ANTEIL_KLEINER_ALS = "Anteil_Kleiner_Als"
    GROESSER_ALS = "Groesser_Als"
    ROUND = "Round"
    CONV_RKMG = "Conv_RKMG"
    WENN_DANN = "Wenn_Dann"
    IMAX = "IMax"
    IMIN = "IMin"
    GRP_SUM = "Grp_Sum"
    QUER_MAX = "Quer_Max"
    QUER_MIN = "Quer_Min"


class ParameterType(str, Enum):
    """Enumeration of parameter types"""
    TIMESERIES_REF = "timeseries_ref"
    CONSTANT = "constant"
    STRING = "string"
    EXPRESSION = "expression"
    PERCENTAGE = "percentage"
    LOSS_FACTOR = "loss_factor"
    OBIS_CODE = "obis_code"
    METERING_POINT_REF = "metering_point_ref"


class FormulaCategory(str, Enum):
    """Enumeration of formula categories"""
    BILANZIERUNG = "BILANZIERUNG"
    NETZNUTZUNG = "NETZNUTZUNG"
    BILANZIERUNG_UND_NETZNUTZUNG = "BILANZIERUNG_UND_NETZNUTZUNG"
    EIGENVERBRAUCH = "EIGENVERBRAUCH"
    VERLUSTE = "VERLUSTE"
    AGGREGATION = "AGGREGATION"


@dataclass
class MeteringPoint:
    """Metering point with OBIS code"""
    meteringPointId: str
    obisCode: str
    direction: str  # CONSUMPTION, FEED_IN, BIDIRECTIONAL
    description: Optional[str] = None


@dataclass
class FormulaParameter:
    """Parameter for a formula function"""
    name: str
    value: Union[str, float, int, Dict[str, Any]]
    type: str  # Use ParameterType enum values
    obisCode: Optional[str] = None
    unit: Optional[str] = None
    scalingFactor: Optional[float] = None


@dataclass
class FormulaExpression:
    """
    Represents a formula expression that can be applied to time series data.
    Examples:
    - Simple: Anteil_Groesser_Als(TS123, 100)
    - Complex: Quer_Max(Anteil_Groesser_Als(TS1, 50), Anteil_Kleiner_Als(TS2, 200))
    """
    function: str  # Function name from FormulaFunction enum
    parameters: List[Union[FormulaParameter, 'FormulaExpression']]
    description: Optional[str] = None


@dataclass
class Formula:
    """
    A complete formula definition with metadata
    """
    formulaId: str
    name: str
    description: str
    expression: FormulaExpression
    inputTimeSeries: List[str]  # List of time series IDs required as input
    outputUnit: str
    outputResolution: str
    createdBy: Optional[str] = None
    createdAt: Optional[str] = None
    version: Optional[str] = None
    category: Optional[str] = None  # Use FormulaCategory enum values
    inputMeteringPoints: Optional[List[MeteringPoint]] = None
    outputObisCode: Optional[str] = None
    lossFactor: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class FormulaSubmission:
    """Submit a new formula definition"""
    messageId: str
    messageDate: str
    sender: MarketParticipant
    formulas: List[Formula]


@dataclass
class CalculationRequest:
    """
    Request to execute a formula on time series data
    """
    calculationId: str
    requestDate: str
    formulaId: str  # Reference to existing formula
    inputTimeSeries: Dict[str, str]  # Map of parameter name -> time series ID
    period: Dict[str, str]  # start and end dates
    requestedBy: MarketParticipant
    outputTimeSeriesId: Optional[str] = None  # Optional: specify output TS ID
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class CalculationResult:
    """Result of a formula calculation"""
    calculationId: str
    formulaId: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    outputTimeSeriesId: str
    completedAt: Optional[str] = None
    errors: Optional[List[Dict[str, str]]] = None


class MaBiSAPIClient:
    """Client for interacting with MaBiS Time Series REST API"""
    
    def __init__(self, base_url: str, client_id: str, client_secret: str):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        
    def authenticate(self) -> str:
        """
        Get OAuth 2.0 access token using client credentials flow
        """
        token_url = self.base_url.replace('/v1', '/oauth/token')
        
        response = requests.post(
            token_url,
            data={
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'timeseries.write'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        response.raise_for_status()
        token_data = response.json()
        self.access_token = token_data['access_token']
        return self.access_token
    
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers with authentication"""
        if not self.access_token:
            self.authenticate()
            
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def submit_time_series(self, submission: TimeSeriesSubmission) -> Dict[str, Any]:
        """
        Submit time series data to MaBiS-Hub
        
        Args:
            submission: TimeSeriesSubmission object containing the data
            
        Returns:
            Acceptance response from the API
        """
        url = f'{self.base_url}/time-series'
        
        # Convert dataclass to dict, handling nested objects
        payload = asdict(submission)
        
        response = requests.post(
            url,
            json=payload,
            headers=self._get_headers()
        )
        
        if response.status_code == 201:
            return response.json()
        elif response.status_code in [400, 422]:
            # Validation error - return problem details
            problem = response.json()
            raise ValueError(f"Validation failed: {problem['detail']}")
        else:
            response.raise_for_status()
    
    def query_time_series(
        self,
        market_location_id: str = None,
        period_start: str = None,
        period_end: str = None,
        measurement_type: str = None,
        resolution: str = None,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """Query time series data with filters"""
        url = f'{self.base_url}/time-series'
        
        params = {
            'pageSize': page_size
        }
        
        if market_location_id:
            params['marketLocationId'] = market_location_id
        if period_start:
            params['periodStart'] = period_start
        if period_end:
            params['periodEnd'] = period_end
        if measurement_type:
            params['measurementType'] = measurement_type
        if resolution:
            params['resolution'] = resolution
        
        response = requests.get(
            url,
            params=params,
            headers=self._get_headers()
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_time_series_by_id(self, time_series_id: str) -> Dict[str, Any]:
        """Retrieve a specific time series by ID"""
        url = f'{self.base_url}/time-series/{time_series_id}'
        
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
    
    def get_balancing_group_aggregation(
        self,
        balancing_group_id: str,
        period_start: str,
        period_end: str,
        aggregation_type: str
    ) -> Dict[str, Any]:
        """Get aggregated balancing group values (Summenzeitreihen)"""
        url = f'{self.base_url}/balancing-groups/{balancing_group_id}/aggregated-values'

        params = {
            'periodStart': period_start,
            'periodEnd': period_end,
            'aggregationType': aggregation_type
        }

        response = requests.get(
            url,
            params=params,
            headers=self._get_headers()
        )

        response.raise_for_status()
        return response.json()

    # ==================== FORMULA API METHODS ====================

    def submit_formula(self, submission: FormulaSubmission) -> Dict[str, Any]:
        """
        Submit a formula definition to the API

        Args:
            submission: FormulaSubmission object containing formula definitions

        Returns:
            Acceptance response with formula IDs
        """
        url = f'{self.base_url}/formulas'

        # Custom serialization for nested dataclasses
        payload = self._serialize_formula_submission(submission)

        response = requests.post(
            url,
            json=payload,
            headers=self._get_headers()
        )

        if response.status_code == 201:
            return response.json()
        elif response.status_code in [400, 422]:
            problem = response.json()
            raise ValueError(f"Formula validation failed: {problem['detail']}")
        else:
            response.raise_for_status()

    def get_formula(self, formula_id: str) -> Dict[str, Any]:
        """Retrieve a formula definition by ID"""
        url = f'{self.base_url}/formulas/{formula_id}'

        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def list_formulas(
        self,
        name_filter: str = None,
        created_by: str = None,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """List available formulas with optional filters"""
        url = f'{self.base_url}/formulas'

        params = {'pageSize': page_size}
        if name_filter:
            params['name'] = name_filter
        if created_by:
            params['createdBy'] = created_by

        response = requests.get(url, params=params, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def execute_calculation(self, request: CalculationRequest) -> Dict[str, Any]:
        """
        Execute a calculation using a formula on time series data

        Args:
            request: CalculationRequest object specifying formula and input data

        Returns:
            Calculation status response
        """
        url = f'{self.base_url}/calculations'

        payload = asdict(request)

        response = requests.post(
            url,
            json=payload,
            headers=self._get_headers()
        )

        if response.status_code == 202:  # Accepted for processing
            return response.json()
        elif response.status_code in [400, 422]:
            problem = response.json()
            raise ValueError(f"Calculation request failed: {problem['detail']}")
        else:
            response.raise_for_status()

    def get_calculation_result(self, calculation_id: str) -> Dict[str, Any]:
        """
        Get the result of a calculation

        Args:
            calculation_id: ID of the calculation to retrieve

        Returns:
            Calculation result including status and output time series ID
        """
        url = f'{self.base_url}/calculations/{calculation_id}'

        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def _serialize_formula_submission(self, submission: FormulaSubmission) -> Dict[str, Any]:
        """Helper to serialize FormulaSubmission with nested expressions"""
        result = {
            'messageId': submission.messageId,
            'messageDate': submission.messageDate,
            'sender': asdict(submission.sender),
            'formulas': []
        }

        for formula in submission.formulas:
            formula_dict = {
                'formulaId': formula.formulaId,
                'name': formula.name,
                'description': formula.description,
                'expression': self._serialize_expression(formula.expression),
                'inputTimeSeries': formula.inputTimeSeries,
                'outputUnit': formula.outputUnit,
                'outputResolution': formula.outputResolution
            }

            if formula.createdBy:
                formula_dict['createdBy'] = formula.createdBy
            if formula.createdAt:
                formula_dict['createdAt'] = formula.createdAt
            if formula.version:
                formula_dict['version'] = formula.version
            if formula.metadata:
                formula_dict['metadata'] = formula.metadata

            result['formulas'].append(formula_dict)

        return result

    def _serialize_expression(self, expr: FormulaExpression) -> Dict[str, Any]:
        """Helper to serialize FormulaExpression recursively"""
        result = {
            'function': expr.function,
            'parameters': []
        }

        for param in expr.parameters:
            if isinstance(param, FormulaExpression):
                # Nested expression - recurse
                result['parameters'].append(self._serialize_expression(param))
            else:
                # Regular parameter
                result['parameters'].append(asdict(param))

        if expr.description:
            result['description'] = expr.description

        return result


def generate_15min_intervals(date: datetime, market_location_id: str) -> List[Interval]:
    """
    Generate 96 intervals (15-minute resolution) for a full day
    Simulates metering data
    """
    intervals = []
    
    for position in range(1, 97):  # 96 intervals per day
        interval_start = date + timedelta(minutes=(position - 1) * 15)
        interval_end = interval_start + timedelta(minutes=15)
        
        # Simulate consumption value (2-3 kWh per 15min)
        quantity = f"{2.0 + (position % 10) * 0.123456:.6f}"
        
        intervals.append(Interval(
            position=position,
            start=interval_start.isoformat().replace('+00:00', 'Z'),
            end=interval_end.isoformat().replace('+00:00', 'Z'),
            quantity=quantity,
            quality="METERED"
        ))
    
    return intervals


def example_submit_metering_data():
    """
    Example: Submit 15-minute metering data for a market location
    This replaces sending a UTILTS EDIFACT message
    """
    
    # Initialize API client
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
    
    # Define sender and receiver
    sender = MarketParticipant(
        id='DE0212345678901',
        role='MSB',
        name='Example Messstellenbetreiber GmbH'
    )
    
    receiver = MarketParticipant(
        id='DE0298765432109',
        role='NB',
        name='Example Netzbetreiber AG'
    )
    
    # Generate data for yesterday
    yesterday = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    
    market_location_id = '10550000000001'
    
    # Generate 96 intervals (15-minute resolution)
    intervals = generate_15min_intervals(yesterday, market_location_id)
    
    # Create time series
    time_series_id = f"TS-MP{market_location_id}-A15MIN-{yesterday.strftime('%Y%m%d')}"
    
    time_series = TimeSeries(
        timeSeriesId=time_series_id,
        marketLocationId=market_location_id,
        measurementType='CONSUMPTION',
        unit='KWH',
        resolution='PT15M',
        period={
            'start': yesterday.isoformat().replace('+00:00', 'Z'),
            'end': (yesterday + timedelta(days=1)).isoformat().replace('+00:00', 'Z')
        },
        intervals=[asdict(interval) for interval in intervals]
    )
    
    # Create submission
    message_id = f"MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    
    submission = TimeSeriesSubmission(
        messageId=message_id,
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        receiver=receiver,
        timeSeries=[time_series]
    )
    
    try:
        # Submit to API
        print(f"Submitting time series for MaLo {market_location_id}...")
        result = client.submit_time_series(submission)
        
        print(f"✅ Success!")
        print(f"   Message ID: {result['messageId']}")
        print(f"   Status: {result['status']}")
        print(f"   Accepted at: {result['acceptanceTime']}")
        print(f"   Time Series IDs: {result['timeSeriesIds']}")
        
    except ValueError as e:
        print(f"❌ Validation Error: {e}")
    except requests.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        if e.response.content:
            problem = e.response.json()
            print(f"   Type: {problem.get('type')}")
            print(f"   Detail: {problem.get('detail')}")


def example_query_metering_data():
    """Example: Query metering data for a market location"""
    
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
    
    # Query yesterday's data
    yesterday = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    
    today = yesterday + timedelta(days=1)
    
    print("Querying time series data...")
    result = client.query_time_series(
        market_location_id='10550000000001',
        period_start=yesterday.isoformat().replace('+00:00', 'Z'),
        period_end=today.isoformat().replace('+00:00', 'Z'),
        resolution='PT15M'
    )
    
    print(f"Found {len(result['timeSeries'])} time series")
    
    if result['timeSeries']:
        ts = result['timeSeries'][0]
        print(f"  Time Series ID: {ts['timeSeriesId']}")
        print(f"  Market Location: {ts['marketLocationId']}")
        print(f"  Intervals: {len(ts['intervals'])}")
        print(f"  First interval: {ts['intervals'][0]['quantity']} {ts['unit']}")


def example_get_balancing_group_aggregation():
    """Example: Get aggregated balancing group data (Summenzeitreihen)"""
    
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )
    
    yesterday = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    
    today = yesterday + timedelta(days=1)
    
    print("Getting balancing group aggregation...")
    result = client.get_balancing_group_aggregation(
        balancing_group_id='DE123456789012-B',
        period_start=yesterday.isoformat().replace('+00:00', 'Z'),
        period_end=today.isoformat().replace('+00:00', 'Z'),
        aggregation_type='CONSUMPTION'
    )
    
    print(f"Balancing Group: {result['balancingGroupId']}")
    print(f"Aggregation Type: {result['aggregationType']}")
    print(f"Total Intervals: {len(result['intervals'])}")
    
    # Calculate total consumption
    total = sum(Decimal(interval['totalQuantity']) for interval in result['intervals'])
    print(f"Total Consumption: {total:.2f} kWh")


def example_submit_simple_formula():
    """
    Example: Submit a simple formula - Anteil_Groesser_Als
    Calculates the portion of time series values above a threshold
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    sender = MarketParticipant(
        id='DE0212345678901',
        role='MSB',
        name='Example TSO'
    )

    # Create a simple formula: Anteil_Groesser_Als(Zeitreihe, 100)
    # Returns values above 100 kWh, otherwise 0
    expression = FormulaExpression(
        function=FormulaFunction.ANTEIL_GROESSER_ALS.value,
        parameters=[
            FormulaParameter(
                name="zeitreihe",
                value="INPUT_TS",
                type="timeseries_ref"
            ),
            FormulaParameter(
                name="grenze",
                value=100.0,
                type="constant"
            )
        ],
        description="Calculate portion above 100 kWh threshold"
    )

    formula = Formula(
        formulaId="FORM-ANTEIL-GT-001",
        name="Anteil oberhalb 100 kWh",
        description="Berechnet den Anteil der Zeitreihenwerte oberhalb 100 kWh",
        expression=expression,
        inputTimeSeries=["INPUT_TS"],
        outputUnit="KWH",
        outputResolution="PT15M",
        createdBy="DE0212345678901",
        version="1.0.0"
    )

    submission = FormulaSubmission(
        messageId=f"FORM-MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        formulas=[formula]
    )

    try:
        print("Submitting formula: Anteil_Groesser_Als...")
        result = client.submit_formula(submission)
        print(f"✅ Formula submitted successfully!")
        print(f"   Message ID: {result.get('messageId')}")
        print(f"   Formula IDs: {result.get('formulaIds')}")
        return result.get('formulaIds', [])[0] if result.get('formulaIds') else None
    except ValueError as e:
        print(f"❌ Validation Error: {e}")
    except requests.HTTPError as e:
        print(f"❌ HTTP Error: {e}")


def example_submit_complex_formula():
    """
    Example: Submit a complex nested formula - Quer_Max with nested expressions
    Quer_Max(Anteil_Groesser_Als(TS1, 50), Anteil_Kleiner_Als(TS2, 200))
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    sender = MarketParticipant(
        id='DE0212345678901',
        role='MSB'
    )

    # Nested expression 1: Anteil_Groesser_Als(TS1, 50)
    expr1 = FormulaExpression(
        function=FormulaFunction.ANTEIL_GROESSER_ALS.value,
        parameters=[
            FormulaParameter(name="zeitreihe", value="TS1", type="timeseries_ref"),
            FormulaParameter(name="grenze", value=50.0, type="constant")
        ]
    )

    # Nested expression 2: Anteil_Kleiner_Als(TS2, 200)
    expr2 = FormulaExpression(
        function=FormulaFunction.ANTEIL_KLEINER_ALS.value,
        parameters=[
            FormulaParameter(name="zeitreihe", value="TS2", type="timeseries_ref"),
            FormulaParameter(name="grenze", value=200.0, type="constant")
        ]
    )

    # Main expression: Quer_Max(expr1, expr2)
    main_expression = FormulaExpression(
        function=FormulaFunction.QUER_MAX.value,
        parameters=[expr1, expr2],
        description="Maximum across two calculated time series"
    )

    formula = Formula(
        formulaId="FORM-QUER-MAX-COMPLEX-001",
        name="Quer Maximum mit verschachtelten Berechnungen",
        description="Berechnet das Maximum zwischen zwei berechneten Zeitreihen",
        expression=main_expression,
        inputTimeSeries=["TS1", "TS2"],
        outputUnit="KWH",
        outputResolution="PT15M",
        version="1.0.0"
    )

    submission = FormulaSubmission(
        messageId=f"FORM-MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        formulas=[formula]
    )

    try:
        print("Submitting complex nested formula: Quer_Max...")
        result = client.submit_formula(submission)
        print(f"✅ Complex formula submitted successfully!")
        print(f"   Formula IDs: {result.get('formulaIds')}")
        return result.get('formulaIds', [])[0] if result.get('formulaIds') else None
    except ValueError as e:
        print(f"❌ Validation Error: {e}")


def example_execute_calculation():
    """
    Example: Execute a calculation using a submitted formula
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    requester = MarketParticipant(
        id='DE0212345678901',
        role='MSB'
    )

    yesterday = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    today = yesterday + timedelta(days=1)

    # Create calculation request
    calc_request = CalculationRequest(
        calculationId=f"CALC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        requestDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        formulaId="FORM-ANTEIL-GT-001",  # Reference to previously submitted formula
        inputTimeSeries={
            "INPUT_TS": "TS-MP10550000000001-A15MIN-20251202"  # Map parameter to actual TS ID
        },
        period={
            'start': yesterday.isoformat().replace('+00:00', 'Z'),
            'end': today.isoformat().replace('+00:00', 'Z')
        },
        requestedBy=requester,
        outputTimeSeriesId="TS-CALC-RESULT-20251202"
    )

    try:
        print("Executing calculation...")
        result = client.execute_calculation(calc_request)
        print(f"✅ Calculation accepted!")
        print(f"   Calculation ID: {result.get('calculationId')}")
        print(f"   Status: {result.get('status')}")

        # Poll for result
        calc_id = result.get('calculationId')
        if calc_id:
            print("\nPolling for calculation result...")
            import time
            for i in range(5):  # Poll up to 5 times
                time.sleep(2)
                calc_result = client.get_calculation_result(calc_id)
                status = calc_result.get('status')
                print(f"   Attempt {i+1}: Status = {status}")

                if status == 'COMPLETED':
                    print(f"✅ Calculation completed!")
                    print(f"   Output Time Series ID: {calc_result.get('outputTimeSeriesId')}")
                    break
                elif status == 'FAILED':
                    print(f"❌ Calculation failed!")
                    print(f"   Errors: {calc_result.get('errors')}")
                    break

    except ValueError as e:
        print(f"❌ Validation Error: {e}")
    except requests.HTTPError as e:
        print(f"❌ HTTP Error: {e}")


def example_wenn_dann_formula():
    """
    Example: Wenn_Dann (If-Then-Else) formula
    Wenn_Dann(LinieA, '>', LinieB, Dann_Wert, Sonst_Wert)
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    sender = MarketParticipant(id='DE0212345678901', role='MSB')

    # Wenn_Dann: If TS1 > TS2, return TS1, else return 0
    expression = FormulaExpression(
        function=FormulaFunction.WENN_DANN.value,
        parameters=[
            FormulaParameter(name="linieA", value="TS1", type="timeseries_ref"),
            FormulaParameter(name="komparator", value=">", type="string"),
            FormulaParameter(name="linieB", value="TS2", type="timeseries_ref"),
            FormulaParameter(name="dann", value="TS1", type="timeseries_ref"),
            FormulaParameter(name="sonst", value=0, type="constant")
        ],
        description="If TS1 > TS2, return TS1, else 0"
    )

    formula = Formula(
        formulaId="FORM-WENN-DANN-001",
        name="Bedingter Vergleich",
        description="Gibt TS1 zurück wenn größer als TS2, sonst 0",
        expression=expression,
        inputTimeSeries=["TS1", "TS2"],
        outputUnit="KWH",
        outputResolution="PT15M",
        version="1.0.0"
    )

    submission = FormulaSubmission(
        messageId=f"FORM-MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        formulas=[formula]
    )

    try:
        print("Submitting Wenn_Dann formula...")
        result = client.submit_formula(submission)
        print(f"✅ Wenn_Dann formula submitted!")
        print(f"   Formula IDs: {result.get('formulaIds')}")
    except ValueError as e:
        print(f"❌ Error: {e}")


if __name__ == '__main__':
    print("MaBiS Time Series API - Python Client Examples")
    print("=" * 80)
    print()

    # ===== TIME SERIES EXAMPLES =====
    print("PART 1: TIME SERIES DATA EXCHANGE")
    print("=" * 80)
    print()

    # Example 1: Submit metering data
    print("Example 1: Submit 15-minute metering data")
    print("-" * 80)
    example_submit_metering_data()
    print()

    # Example 2: Query metering data
    print("Example 2: Query metering data")
    print("-" * 80)
    example_query_metering_data()
    print()

    # Example 3: Get balancing group aggregation
    print("Example 3: Get balancing group aggregation")
    print("-" * 80)
    example_get_balancing_group_aggregation()
    print()

    # ===== FORMULA EXAMPLES =====
    print("\n\n")
    print("PART 2: CALCULATION FORMULAS")
    print("=" * 80)
    print()

    # Example 4: Submit simple formula
    print("Example 4: Submit simple formula (Anteil_Groesser_Als)")
    print("-" * 80)
    example_submit_simple_formula()
    print()

    # Example 5: Submit complex nested formula
    print("Example 5: Submit complex nested formula (Quer_Max)")
    print("-" * 80)
    example_submit_complex_formula()
    print()

    # Example 6: Execute calculation
    print("Example 6: Execute calculation using formula")
    print("-" * 80)
    example_execute_calculation()
    print()

    # Example 7: Wenn_Dann formula
    print("Example 7: Submit Wenn_Dann (If-Then-Else) formula")
    print("-" * 80)
    example_wenn_dann_formula()
    print()

    # ===== REAL-WORLD EXAMPLES FROM MESSKONZEPT =====
    print("\n\n")
    print("PART 3: REAL-WORLD FORMULAS FROM MESSKONZEPT DOCUMENTS")
    print("=" * 80)
    print()

    # Example 8: PV with loss factor
    print("Example 8: PV Park with 0.49% Loss Factor (from KW Messkonzept)")
    print("-" * 80)
    example_pv_loss_factor()
    print()

    # Example 9: Self-consumption aggregation
    print("Example 9: Total Self-Consumption Aggregation (from BESS Messkonzept)")
    print("-" * 80)
    example_selfconsumption_aggregation()
    print()


def example_pv_loss_factor():
    """
    Real-world example from KW Messkonzept:
    PV Park billing with 0.49% loss factor
    ΣBil.PV W− = W−3.5.7 * (1 - fVerluste) where fVerluste = 0.49%
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    sender = MarketParticipant(id='DE0212345678901', role='MSB')

    # Metering point definition
    pv_meter = MeteringPoint(
        meteringPointId="ZP_3.5.7",
        obisCode="1-1:2.29.0",
        direction="FEED_IN",
        description="PV-Park feed-in meter"
    )

    # Simple formula with scaling factor for loss deduction
    # W−3.5.7 * 0.9951 (which is 1 - 0.0049)
    expression = FormulaExpression(
        function=FormulaFunction.GRP_SUM.value,
        parameters=[
            FormulaParameter(
                name="pv_feedin",
                value="W-3.5.7",
                type=ParameterType.TIMESERIES_REF.value,
                obisCode="1-1:2.29.0",
                scalingFactor=0.9951  # Apply 0.49% loss
            )
        ],
        description="PV feed-in with 0.49% loss deduction"
    )

    formula = Formula(
        formulaId="FORM-KW-PV-BILLING-LOSSES",
        name="ΣBil.PV W− mit Verluste",
        description="W−3.5.7 * (1 - fVerluste) where fVerluste = 0.49%",
        expression=expression,
        inputTimeSeries=["W-3.5.7"],
        outputUnit="KWH",
        outputResolution="PT15M",
        category=FormulaCategory.BILANZIERUNG.value,
        inputMeteringPoints=[pv_meter],
        outputObisCode="1-1:2.29.0",
        lossFactor=0.0049,
        version="1.0.0",
        metadata={
            "facilityType": "PV",
            "voltageLevel": "30kV",
            "lossPercentage": "0.49%",
            "billingRelevant": True,
            "source": "KW Messkonzept PDF"
        }
    )

    submission = FormulaSubmission(
        messageId=f"FORM-MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        formulas=[formula]
    )

    try:
        print("Submitting real-world PV loss factor formula...")
        result = client.submit_formula(submission)
        print(f"✅ Formula submitted!")
        print(f"   Formula ID: {result.get('formulaIds', [])[0] if result.get('formulaIds') else 'N/A'}")
        print(f"   Loss Factor: {formula.lossFactor * 100:.2f}%")
        print(f"   Scaling Factor: {0.9951}")
    except ValueError as e:
        print(f"❌ Error: {e}")


def example_selfconsumption_aggregation():
    """
    Real-world example from BESS Messkonzept:
    ΣEV W+ = W+ZEV1 + W+ZE_UW + W+ZEV2 + W+ZEV3
    (billing and network usage relevant)
    """
    client = MaBiSAPIClient(
        base_url='https://api-test.mabis-hub.de/v1',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET'
    )

    sender = MarketParticipant(id='DE0212345678901', role='MSB')

    # Define metering points
    metering_points = [
        MeteringPoint("ZEV1", "1-1:1.29.0", "CONSUMPTION", "Battery 1 self-consumption"),
        MeteringPoint("ZE_UW", "1-1:1.29.0", "CONSUMPTION", "Transformer self-consumption"),
        MeteringPoint("ZEV2", "1-1:1.29.0", "CONSUMPTION", "Battery 2 self-consumption"),
        MeteringPoint("ZEV3", "1-1:1.29.0", "CONSUMPTION", "Battery 3 self-consumption")
    ]

    # Create aggregation formula
    expression = FormulaExpression(
        function=FormulaFunction.GRP_SUM.value,
        parameters=[
            FormulaParameter(
                name="ts1",
                value="W+ZEV1",
                type=ParameterType.TIMESERIES_REF.value,
                obisCode="1-1:1.29.0"
            ),
            FormulaParameter(
                name="ts2",
                value="W+ZE_UW",
                type=ParameterType.TIMESERIES_REF.value,
                obisCode="1-1:1.29.0"
            ),
            FormulaParameter(
                name="ts3",
                value="W+ZEV2",
                type=ParameterType.TIMESERIES_REF.value,
                obisCode="1-1:1.29.0"
            ),
            FormulaParameter(
                name="ts4",
                value="W+ZEV3",
                type=ParameterType.TIMESERIES_REF.value,
                obisCode="1-1:1.29.0"
            )
        ],
        description="Sum of all self-consumption metering points"
    )

    formula = Formula(
        formulaId="FORM-BESS-TOTAL-EV",
        name="ΣEV W+",
        description="W+ZEV1 + W+ZE_UW + W+ZEV2 + W+ZEV3",
        expression=expression,
        inputTimeSeries=["W+ZEV1", "W+ZE_UW", "W+ZEV2", "W+ZEV3"],
        outputUnit="KWH",
        outputResolution="PT15M",
        category=FormulaCategory.BILANZIERUNG_UND_NETZNUTZUNG.value,
        inputMeteringPoints=metering_points,
        outputObisCode="1-1:1.29.0",
        version="1.0.0",
        metadata={
            "facilityType": "BATTERY",
            "tsoOperator": "50Hertz",
            "location": "Staßfurt",
            "billingRelevant": True,
            "networkUsageRelevant": True,
            "source": "BESS Messkonzept PDF"
        }
    )

    submission = FormulaSubmission(
        messageId=f"FORM-MSG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        messageDate=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        sender=sender,
        formulas=[formula]
    )

    try:
        print("Submitting self-consumption aggregation formula...")
        result = client.submit_formula(submission)
        print(f"✅ Formula submitted!")
        print(f"   Formula ID: {result.get('formulaIds', [])[0] if result.get('formulaIds') else 'N/A'}")
        print(f"   Category: {formula.category}")
        print(f"   Metering Points: {len(metering_points)}")
        print(f"   TSO: {formula.metadata.get('tsoOperator')}")
    except ValueError as e:
        print(f"❌ Error: {e}")
