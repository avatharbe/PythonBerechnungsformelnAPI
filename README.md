# MaBiS Time Series REST API Prototype

## Overview

This prototype demonstrates a modern REST API approach for exchanging time series data in the German energy market, providing functionality equivalent to the UTILTS EDIFACT format.

## Design Principles

### 1. **Hybrid Approach: REST + CIM Semantics**

This API combines the best of both worlds:
- **External Interface**: RESTful JSON APIs (developer-friendly)
- **Internal Data Model**: CIM-aligned semantics (ENTSO-E compatible)
- **Translation Layer**: Can map to/from CIM XML when needed

### 2. **Alignment with Standards**

#### German Energy Market (EDI@Energy)
- Market Location IDs (Marktlokations-ID / MRID format)
- OBIS codes for smart meter data
- German market roles (MSB, NB, LF, BKV, BA, MV)
- Balancing group identifiers

#### International Standards
- ISO 8601 / RFC 3339 for date/time
- RFC 7807 for error responses (Problem Details)
- OAuth 2.0 for security
- OpenAPI 3.0 for API specification

#### ENTSO-E/CIM Compatibility
- MRID format compatible with IEC 61970/61968
- EIC codes for market participants
- Data model can be mapped to CIM TimeSeries

### 3. **Key Features Mimicking UTILTS**

| UTILTS Segment | REST API Equivalent | Description |
|---|---|---|
| UNH | Message Header | Handled in HTTP headers + message metadata |
| BGM | Beginning of Message | `messageId` and `messageDate` |
| NAD | Name and Address | `MarketParticipant` object |
| IDE | Identity | `timeSeriesId`, `marketLocationId` |
| DTM | Date/Time/Period | `period` object with ISO 8601 timestamps |
| SEQ | Sequence Details | `intervals` array with `position` |
| QTY | Quantity | `quantity` field with decimal format |
| STS | Status | `quality` and `status` enums |
| RFF | Reference | `messageId` references |

## API Endpoints

### Time Series Operations

#### POST /time-series
Submit time series data (equivalent to sending UTILTS message)

**Request:**
```json
{
  "messageId": "MSG-2025-12-02-001",
  "messageDate": "2025-12-02T14:30:00Z",
  "sender": {
    "id": "DE0212345678901",
    "role": "MSB"
  },
  "receiver": {
    "id": "DE0298765432109",
    "role": "NB"
  },
  "timeSeries": [{
    "timeSeriesId": "TS-MP10550000000001-A15MIN-20251202",
    "marketLocationId": "10550000000001",
    "measurementType": "CONSUMPTION",
    "unit": "KWH",
    "resolution": "PT15M",
    "period": {
      "start": "2025-12-02T00:00:00Z",
      "end": "2025-12-03T00:00:00Z"
    },
    "intervals": [
      {
        "position": 1,
        "start": "2025-12-02T00:00:00Z",
        "end": "2025-12-02T00:15:00Z",
        "quantity": "2.456789",
        "quality": "METERED"
      }
    ]
  }]
}
```

**Response (201 Created):**
```json
{
  "messageId": "MSG-2025-12-02-001",
  "acceptanceTime": "2025-12-02T14:30:05Z",
  "status": "ACCEPTED",
  "timeSeriesIds": ["TS-MP10550000000001-A15MIN-20251202"]
}
```

#### GET /time-series
Query time series data with filters

**Request:**
```
GET /time-series?marketLocationId=10550000000001&periodStart=2025-12-01T00:00:00Z&periodEnd=2025-12-02T00:00:00Z&resolution=PT15M
```

#### GET /time-series/{timeSeriesId}
Retrieve specific time series by ID

### Balancing Group Operations

#### GET /balancing-groups/{balancingGroupId}/aggregated-values
Get aggregated balancing group data (Summenzeitreihen)

**Request:**
```
GET /balancing-groups/DE123456789012-B/aggregated-values?periodStart=2025-12-01T00:00:00Z&periodEnd=2025-12-02T00:00:00Z&aggregationType=CONSUMPTION
```

## Data Formats

### Energy-Specific Formats

The API uses custom OpenAPI formats aligned with German energy market standards:

| Format | Type | Description | Example |
|---|---|---|---|
| `mrid` | string | Market Resource Identifier | `10550000000001` |
| `obis` | string | OBIS code for smart meter data | `1-0:1.8.0*255` |
| `edifact-id` | string | EDIFACT identifier (GLN) | `DE0212345678901` |
| `balancing-group` | string | Bilanzkreis identifier | `DE123456789012-B` |
| `ts` | string | Time series ID | `TS-MP10550000000001-A15MIN-20251202` |
| `ebid` | string | European Energy ID (EIC) | `11X1001234567890U` |

### Decimal Precision

All energy quantities use `string` with `format: decimal` to avoid floating-point precision issues:
- ✅ Correct: `"2.456789"` (string with 6 decimal places)
- ❌ Wrong: `2.456789` (number - loses precision)

### Date/Time Format

All timestamps use ISO 8601 / RFC 3339 in UTC:
- ✅ Correct: `"2025-12-02T14:30:00Z"`
- ❌ Wrong: `"2025-12-02T14:30:00+01:00"` (avoid local offsets)

## Error Handling (RFC 7807)

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://api.mabis-hub.de/problems/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Time series data validation failed",
  "instance": "/time-series",
  "invalidParams": [
    {
      "name": "intervals[5].quantity",
      "reason": "Must have maximum 6 decimal places"
    }
  ]
}
```

## Security

### OAuth 2.0 Client Credentials Flow

```bash
# Get access token
curl -X POST https://auth.mabis-hub.de/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=timeseries.write"

# Use token
curl -X POST https://api.mabis-hub.de/v1/time-series \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @timeseries-data.json
```

### Required Scopes

- `timeseries.read` - Read time series data
- `timeseries.write` - Submit time series data
- `balancing.read` - Read balancing group data

## Comparison: UTILTS vs REST API

### UTILTS EDIFACT (Old)
```
UNH+1+UTILTS:D:10A:UN'
BGM+E40+MSG-2025-12-02-001+9'
DTM+137:202512021430:203'
NAD+MS+DE0212345678901::293'
NAD+NE+DE0298765432109::293'
IDE+24+10550000000001'
SEQ++1'
DTM+163:202512020000:203'
DTM+164:202512020015:203'
QTY+220:2.456789:KWH'
```

### REST API (New)
```json
{
  "messageId": "MSG-2025-12-02-001",
  "messageDate": "2025-12-02T14:30:00Z",
  "sender": {"id": "DE0212345678901", "role": "MSB"},
  "receiver": {"id": "DE0298765432109", "role": "NB"},
  "timeSeries": [{
    "marketLocationId": "10550000000001",
    "intervals": [{
      "position": 1,
      "start": "2025-12-02T00:00:00Z",
      "end": "2025-12-02T00:15:00Z",
      "quantity": "2.456789",
      "quality": "METERED"
    }]
  }]
}
```

## Advantages Over UTILTS

### Developer Experience
- ✅ Human-readable JSON vs cryptic EDIFACT syntax
- ✅ Self-documenting with OpenAPI
- ✅ Standard HTTP tools (Postman, curl, etc.)
- ✅ Native support in all modern programming languages

### Technical Benefits
- ✅ RESTful principles (resources, HTTP methods)
- ✅ Built-in validation and type checking
- ✅ Standardized error responses (RFC 7807)
- ✅ OAuth 2.0 security (industry standard)
- ✅ Pagination for large datasets
- ✅ Versioning through URL path

### Operational Improvements
- ✅ Real-time synchronous responses
- ✅ Detailed validation errors
- ✅ Rate limiting and throttling
- ✅ Modern monitoring and observability
- ✅ Cloud-native scalability

### CIM Compatibility
- ✅ Data model can map to IEC 62325 CIM TimeSeries
- ✅ MRID format compatible with CIM
- ✅ Can generate CIM XML for ENTSO-E exchanges
- ✅ European interoperability without being XML-heavy

## Migration Strategy

### Phase 1: Dual Protocol Support
- Keep EDIFACT UTILTS operational
- Add REST API in parallel
- Market participants choose protocol
- Translation layer maps between formats

### Phase 2: Gradual Migration
- Incentivize REST API adoption
- Provide migration tools
- Support period (6-12 months)
- Deprecation timeline for UTILTS

### Phase 3: REST-Only
- Sunset EDIFACT UTILTS
- Full REST API ecosystem
- CIM XML gateway for European exchanges
- Modern development practices

## CIM XML Mapping Example

The REST API data can be mapped to CIM XML for ENTSO-E compatibility:

**REST API Internal:**
```json
{
  "marketLocationId": "10550000000001",
  "quantity": "2.456789"
}
```

**CIM XML External (when needed):**
```xml
<TimeSeries>
  <mRID>10550000000001</mRID>
  <businessType>A04</businessType>
  <Period>
    <Point>
      <position>1</position>
      <quantity>2.456789</quantity>
    </Point>
  </Period>
</TimeSeries>
```

## Performance Considerations

### Rate Limits
- 100 requests per second per client
- 10,000 time series per request max
- Burst capacity: 200 requests

### Pagination
- Default page size: 100 items
- Maximum page size: 1000 items
- Cursor-based pagination for consistency

### Caching
- ETags for conditional requests
- Cache-Control headers
- CDN-friendly design

## Testing

The OpenAPI specification can be used with tools like:
- **Swagger UI** - Interactive documentation
- **Postman** - API testing
- **Prism** - Mock server generation
- **OpenAPI Generator** - Client SDK generation

## Next Steps

1. **Validate with stakeholders** - TSOs, market participants, BNetzA
2. **Create reference implementation** - Java/Python sample code
3. **Define ADRs** - Architecture Decision Records
4. **Security review** - OAuth setup, rate limiting
5. **Performance testing** - Load testing scenarios
6. **Pilot program** - Small-scale rollout

## Contact

For questions or feedback on this prototype:
- Email: api-support@mabis-hub.de
- GitHub: (repository URL)
- Confluence: (documentation link)
