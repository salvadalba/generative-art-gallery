# Generative Art Gallery - API Documentation

## Overview

The Generative Art Gallery API provides endpoints for art generation, user management, and NFT operations. This documentation covers all available endpoints, request/response formats, and authentication methods.

## Base URL

- **Production**: `https://api.generative-art-gallery.com`
- **Development**: `http://localhost:8000`

## Authentication

### API Key Authentication

Include your API key in the request headers:

```http
Authorization: Bearer YOUR_API_KEY
```

### Rate Limiting

- **Standard**: 100 requests per 15 minutes
- **Generation**: 20 requests per hour
- **NFT Operations**: 50 requests per hour

## Endpoints

### Health Check

#### GET /health

Check service health status.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ipfs": "healthy"
  }
}
```

**Status Codes:**
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is unhealthy

### Art Generation

#### POST /generate

Generate a new art piece using GAN.

**Request:**
```http
POST /generate
Content-Type: application/json

{
  "seed": 12345,
  "color_a": "#ff0000",
  "color_b": "#00ff00",
  "size": 512,
  "style": "abstract",
  "complexity": 0.7
}
```

**Parameters:**
- `seed` (integer, required): Random seed for generation (1-999999)
- `color_a` (string, required): Primary color in hex format
- `color_b` (string, required): Secondary color in hex format
- `size` (integer, optional): Image size in pixels (default: 512)
- `style` (string, optional): Art style (default: "abstract")
- `complexity` (float, optional): Complexity level 0.0-1.0 (default: 0.5)

**Response:**
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "estimated_time": 45,
  "parameters": {
    "seed": 12345,
    "color_a": "#ff0000",
    "color_b": "#00ff00",
    "size": 512,
    "style": "abstract",
    "complexity": 0.7
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `202 Accepted`: Generation job created
- `400 Bad Request`: Invalid parameters
- `429 Too Many Requests`: Rate limit exceeded

#### GET /generate/{job_id}

Check the status of a generation job.

**Request:**
```http
GET /generate/job_123456
```

**Response:**
```json
{
  "job_id": "job_123456",
  "status": "completed",
  "progress": 100,
  "result": {
    "image_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/image.png",
    "metadata_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/metadata.json",
    "parameters": {
      "seed": 12345,
      "color_a": "#ff0000",
      "color_b": "#00ff00",
      "size": 512
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:31:30Z"
}
```

**Status Values:**
- `queued`: Job is waiting to be processed
- `processing`: Job is currently being processed
- `completed`: Job completed successfully
- `failed`: Job failed during processing

**Status Codes:**
- `200 OK`: Job status retrieved
- `404 Not Found`: Job not found

### Gallery Management

#### GET /gallery

Retrieve a list of art pieces with pagination.

**Request:**
```http
GET /gallery?page=1&limit=20&sort=created_at&order=desc&creator=0x...
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `sort` (string, optional): Sort field (default: "created_at")
- `order` (string, optional): Sort order: "asc" or "desc" (default: "desc")
- `creator` (string, optional): Filter by creator address
- `style` (string, optional): Filter by art style
- `from_date` (string, optional): Filter by creation date (ISO 8601)
- `to_date` (string, optional): Filter by creation date (ISO 8601)

**Response:**
```json
{
  "data": [
    {
      "id": "art_123456",
      "job_id": "job_123456",
      "title": "Generative Art #12345",
      "creator": "0x1234567890abcdef",
      "image_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/image.png",
      "metadata_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/metadata.json",
      "parameters": {
        "seed": 12345,
        "color_a": "#ff0000",
        "color_b": "#00ff00",
        "size": 512,
        "style": "abstract",
        "complexity": 0.7
      },
      "created_at": "2024-01-15T10:31:30Z",
      "nft_minted": false,
      "nft_token_id": null,
      "nft_contract": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

**Status Codes:**
- `200 OK`: Gallery data retrieved successfully

#### GET /gallery/{art_id}

Retrieve detailed information about a specific art piece.

**Request:**
```http
GET /gallery/art_123456
```

**Response:**
```json
{
  "id": "art_123456",
  "job_id": "job_123456",
  "title": "Generative Art #12345",
  "creator": "0x1234567890abcdef",
  "image_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/image.png",
  "metadata_url": "https://ipfs.io/ipfs/QmXxxxxxxxxx/metadata.json",
  "parameters": {
    "seed": 12345,
    "color_a": "#ff0000",
    "color_b": "#00ff00",
    "size": 512,
    "style": "abstract",
    "complexity": 0.7
  },
  "created_at": "2024-01-15T10:31:30Z",
  "nft_minted": true,
  "nft_token_id": "123",
  "nft_contract": "0xabcdef1234567890",
  "nft_metadata": {
    "name": "Generative Art #12345",
    "description": "Unique generative art piece",
    "image": "https://ipfs.io/ipfs/QmXxxxxxxxxx/image.png",
    "attributes": [
      {
        "trait_type": "Seed",
        "value": "12345"
      },
      {
        "trait_type": "Primary Color",
        "value": "#ff0000"
      },
      {
        "trait_type": "Secondary Color",
        "value": "#00ff00"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Art piece retrieved successfully
- `404 Not Found`: Art piece not found

### NFT Operations

#### POST /mint/{art_id}

Mint an art piece as an NFT.

**Request:**
```http
POST /mint/art_123456
Content-Type: application/json

{
  "creator_address": "0x1234567890abcdef",
  "metadata": {
    "name": "My Custom Art Title",
    "description": "A unique generative art piece"
  },
  "royalty_percentage": 5
}
```

**Parameters:**
- `creator_address` (string, required): Ethereum address of the creator
- `metadata` (object, optional): Custom metadata for the NFT
- `royalty_percentage` (integer, optional): Royalty percentage for creator (default: 5)

**Response:**
```json
{
  "mint_id": "mint_123456",
  "art_id": "art_123456",
  "status": "processing",
  "transaction_hash": "0xabcdef1234567890",
  "token_id": "123",
  "contract_address": "0x1234567890abcdef",
  "metadata_uri": "https://ipfs.io/ipfs/QmXxxxxxxxxx/metadata.json",
  "estimated_gas": "0.01",
  "created_at": "2024-01-15T10:35:00Z"
}
```

**Status Codes:**
- `202 Accepted`: Minting process initiated
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Art piece not found
- `409 Conflict`: Already minted

#### GET /mint/{mint_id}

Check the status of a minting operation.

**Request:**
```http
GET /mint/mint_123456
```

**Response:**
```json
{
  "mint_id": "mint_123456",
  "art_id": "art_123456",
  "status": "completed",
  "transaction_hash": "0xabcdef1234567890",
  "token_id": "123",
  "contract_address": "0x1234567890abcdef",
  "metadata_uri": "https://ipfs.io/ipfs/QmXxxxxxxxxx/metadata.json",
  "block_number": 15000000,
  "blockchain_url": "https://etherscan.io/tx/0xabcdef1234567890",
  "created_at": "2024-01-15T10:35:00Z",
  "completed_at": "2024-01-15T10:36:30Z"
}
```

**Status Values:**
- `processing`: Transaction is being processed
- `completed`: Transaction confirmed on blockchain
- `failed`: Transaction failed

### User Management

#### GET /user/{address}

Retrieve user information and statistics.

**Request:**
```http
GET /user/0x1234567890abcdef
```

**Response:**
```json
{
  "address": "0x1234567890abcdef",
  "created_at": "2024-01-01T00:00:00Z",
  "statistics": {
    "total_art_generated": 25,
    "total_nfts_minted": 10,
    "total_views": 150,
    "average_rating": 4.5
  },
  "recent_activity": [
    {
      "type": "art_generated",
      "art_id": "art_123456",
      "timestamp": "2024-01-15T10:31:30Z"
    },
    {
      "type": "nft_minted",
      "art_id": "art_123455",
      "token_id": "122",
      "timestamp": "2024-01-14T15:20:00Z"
    }
  ]
}
```

### System Information

#### GET /system/info

Get system information and configuration.

**Request:**
```http
GET /system/info
```

**Response:**
```json
{
  "version": "1.0.0",
  "environment": "production",
  "supported_styles": ["abstract", "geometric", "organic", "minimal"],
  "max_image_size": 2048,
  "supported_formats": ["png", "jpg"],
  "generation_timeout": 300,
  "rate_limits": {
    "standard": "100/15min",
    "generation": "20/hour",
    "nft_operations": "50/hour"
  },
  "blockchain": {
    "network": "ethereum",
    "chain_id": 1,
    "contract_address": "0x1234567890abcdef"
  }
}
```

### Statistics

#### GET /stats

Get system statistics and metrics.

**Request:**
```http
GET /stats
```

**Response:**
```json
{
  "total_art_generated": 1250,
  "total_nfts_minted": 450,
  "active_users": 89,
  "generation_success_rate": 0.98,
  "average_generation_time": 45.2,
  "popular_styles": [
    {"style": "abstract", "count": 750},
    {"style": "geometric", "count": 300},
    {"style": "organic", "count": 200}
  ],
  "daily_stats": {
    "art_generated": 45,
    "nfts_minted": 12,
    "new_users": 3
  }
}
```

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "The provided parameters are invalid",
    "details": {
      "seed": "Must be between 1 and 999999",
      "color_a": "Must be a valid hex color"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456"
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_PARAMETERS` | Request parameters are invalid | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | 429 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

### Common Error Scenarios

#### Rate Limiting
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 15 minutes.",
    "details": {
      "limit": 100,
      "window": "15 minutes",
      "retry_after": 900
    }
  }
}
```

#### Invalid Parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid generation parameters",
    "details": {
      "seed": "Must be a positive integer",
      "color_a": "Invalid hex color format",
      "size": "Must be one of: 256, 512, 1024, 2048"
    }
  }
}
```

## WebSocket API

### Connection

Connect to the WebSocket endpoint for real-time updates:

```javascript
const ws = new WebSocket('wss://api.generative-art-gallery.com/ws');
```

### Events

#### Job Status Updates

```json
{
  "type": "job_update",
  "data": {
    "job_id": "job_123456",
    "status": "processing",
    "progress": 75,
    "estimated_time_remaining": 15
  }
}
```

#### Mint Status Updates

```json
{
  "type": "mint_update",
  "data": {
    "mint_id": "mint_123456",
    "status": "completed",
    "transaction_hash": "0xabcdef1234567890",
    "block_number": 15000000
  }
}
```

## Code Examples

### JavaScript/Node.js

```javascript
// Generate art
const response = await fetch('https://api.generative-art-gallery.com/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    seed: 12345,
    color_a: '#ff0000',
    color_b: '#00ff00',
    size: 512
  })
});

const job = await response.json();
console.log('Job created:', job.job_id);

// Check job status
const statusResponse = await fetch(`https://api.generative-art-gallery.com/generate/${job.job_id}`);
const status = await statusResponse.json();
console.log('Job status:', status.status);
```

### Python

```python
import requests
import json

# Generate art
response = requests.post(
    'https://api.generative-art-gallery.com/generate',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'seed': 12345,
        'color_a': '#ff0000',
        'color_b': '#00ff00',
        'size': 512
    }
)

job = response.json()
print(f"Job created: {job['job_id']}")

# Check job status
status_response = requests.get(f"https://api.generative-art-gallery.com/generate/{job['job_id']}")
status = status_response.json()
print(f"Job status: {status['status']}")
```

### cURL

```bash
# Generate art
curl -X POST "https://api.generative-art-gallery.com/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "seed": 12345,
    "color_a": "#ff0000",
    "color_b": "#00ff00",
    "size": 512
  }'

# Check job status
curl "https://api.generative-art-gallery.com/generate/job_123456" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## SDKs and Libraries

### JavaScript SDK

```bash
npm install generative-art-gallery-sdk
```

```javascript
import { GenerativeArtGallery } from 'generative-art-gallery-sdk';

const gallery = new GenerativeArtGallery({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://api.generative-art-gallery.com'
});

// Generate art
const job = await gallery.generate({
  seed: 12345,
  color_a: '#ff0000',
  color_b: '#00ff00',
  size: 512
});

// Wait for completion
const result = await gallery.waitForCompletion(job.job_id);
console.log('Art generated:', result.image_url);
```

### Python SDK

```bash
pip install generative-art-gallery-sdk
```

```python
from generative_art_gallery import GenerativeArtGallery

gallery = GenerativeArtGallery(
    api_key='YOUR_API_KEY',
    base_url='https://api.generative-art-gallery.com'
)

# Generate art
job = gallery.generate(
    seed=12345,
    color_a='#ff0000',
    color_b='#00ff00',
    size=512
)

# Wait for completion
result = gallery.wait_for_completion(job.job_id)
print(f"Art generated: {result.image_url}")
```

## Changelog

### Version 1.0.0
- Initial API release
- Art generation endpoints
- NFT minting functionality
- Gallery management
- User statistics

### Version 1.1.0 (Planned)
- Batch generation support
- Advanced filtering options
- Webhook notifications
- Enhanced metadata support

## Support

For API support, please contact:
- **Email**: api-support@generative-art-gallery.com
- **Discord**: Join our developer community
- **Documentation**: https://docs.generative-art-gallery.com
- **Status Page**: https://status.generative-art-gallery.com

---

*This documentation is regularly updated. For the latest version, visit the documentation section of the application.*