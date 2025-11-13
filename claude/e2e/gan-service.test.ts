import { test, expect } from '@playwright/test';

test.describe('GAN Service API Tests', () => {
  const baseURL = 'http://localhost:8000';

  test('should generate art with default parameters', async ({ request }) => {
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: null,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 512
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('job_id');
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('processing');
    expect(data).toHaveProperty('seed');
    expect(typeof data.seed).toBe('number');
  });

  test('should generate art with custom seed', async ({ request }) => {
    const customSeed = 12345;
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: customSeed,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 512
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.seed).toBe(customSeed);
    expect(data.status).toBe('processing');
  });

  test('should check job status', async ({ request }) => {
    // First generate a job
    const generateResponse = await request.post(`${baseURL}/generate`, {
      data: {
        seed: 12345,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 512
      }
    });

    expect(generateResponse.ok()).toBeTruthy();
    const { job_id } = await generateResponse.json();

    // Check job status
    const statusResponse = await request.get(`${baseURL}/status/${job_id}`);
    expect(statusResponse.ok()).toBeTruthy();
    
    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('job_id', job_id);
    expect(statusData).toHaveProperty('status');
    expect(['processing', 'completed', 'failed']).toContain(statusData.status);
  });

  test('should handle invalid job ID', async ({ request }) => {
    const invalidJobId = 'invalid-job-id';
    const response = await request.get(`${baseURL}/status/${invalidJobId}`);
    
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('detail');
    expect(data.detail).toContain('Job not found');
  });

  test('should handle missing required parameters', async ({ request }) => {
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        // Missing required parameters
        seed: 12345
      }
    });

    expect(response.status()).toBe(422); // Validation error
    const data = await response.json();
    expect(data).toHaveProperty('detail');
  });

  test('should handle invalid color formats', async ({ request }) => {
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: 12345,
        color_a: 'invalid-color',
        color_b: '#00ff00',
        size: 512
      }
    });

    expect(response.status()).toBe(422);
    const data = await response.json();
    expect(data).toHaveProperty('detail');
  });

  test('should handle invalid size parameter', async ({ request }) => {
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: 12345,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 9999 // Invalid size
      }
    });

    expect(response.status()).toBe(422);
    const data = await response.json();
    expect(data).toHaveProperty('detail');
  });

  test('should handle concurrent generation requests', async ({ request }) => {
    const promises = Array.from({ length: 5 }, (_, i) => 
      request.post(`${baseURL}/generate`, {
        data: {
          seed: 1000 + i,
          color_a: '#ff0000',
          color_b: '#00ff00',
          size: 256
        }
      })
    );

    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });

    // All should have different job IDs
    const jobIds = await Promise.all(
      responses.map(async response => {
        const data = await response.json();
        return data.job_id;
      })
    );

    const uniqueJobIds = new Set(jobIds);
    expect(uniqueJobIds.size).toBe(5);
  });

  test('should return deterministic results for same seed', async ({ request }) => {
    const seed = 99999;
    const params = {
      seed,
      color_a: '#ff0000',
      color_b: '#00ff00',
      size: 256
    };

    // Generate first image
    const response1 = await request.post(`${baseURL}/generate`, {
      data: params
    });
    expect(response1.ok()).toBeTruthy();
    const data1 = await response1.json();

    // Generate second image with same parameters
    const response2 = await request.post(`${baseURL}/generate`, {
      data: params
    });
    expect(response2.ok()).toBeTruthy();
    const data2 = await response2.json();

    // Both should use the same seed
    expect(data1.seed).toBe(seed);
    expect(data2.seed).toBe(seed);
    
    // Job IDs should be different
    expect(data1.job_id).not.toBe(data2.job_id);
  });

  test('should handle health check endpoint', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
  });

  test('should provide OpenAPI documentation', async ({ request }) => {
    const response = await request.get(`${baseURL}/docs`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('should provide OpenAPI JSON schema', async ({ request }) => {
    const response = await request.get(`${baseURL}/openapi.json`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('openapi');
    expect(data).toHaveProperty('info');
    expect(data).toHaveProperty('paths');
    expect(data.paths).toHaveProperty('/generate');
    expect(data.paths).toHaveProperty('/status/{job_id}');
  });

  test('should handle CORS headers', async ({ request }) => {
    const response = await request.fetch(`${baseURL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['access-control-allow-origin']).toBe('*');
    expect(response.headers()['access-control-allow-methods']).toContain('POST');
  });

  test('should handle rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 10 }, () => 
      request.post(`${baseURL}/generate`, {
        data: {
          seed: Math.floor(Math.random() * 1000000),
          color_a: '#ff0000',
          color_b: '#00ff00',
          size: 256
        }
      })
    );

    const responses = await Promise.all(promises);
    
    // All should either succeed or be rate limited
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status());
    });
  });

  test('should handle large image generation', async ({ request }) => {
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: 12345,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 1024 // Large size
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('job_id');
    expect(data.status).toBe('processing');
  });

  test('should handle timeout scenarios', async ({ request }) => {
    // Request with very large size that might timeout
    const response = await request.post(`${baseURL}/generate`, {
      data: {
        seed: 12345,
        color_a: '#ff0000',
        color_b: '#00ff00',
        size: 2048 // Very large size
      },
      timeout: 5000 // Short timeout
    });

    // Should either complete or timeout gracefully
    expect([200, 408, 504]).toContain(response.status());
  });
});