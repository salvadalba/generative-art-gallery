// Security Configuration for Generative Art Gallery

export const SecurityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Three.js shaders
        "https://cdnjs.cloudflare.com", // For external libraries
        "https://unpkg.com" // For npm packages
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:", // For canvas exports
        "blob:", // For Three.js textures
        "https://trae-api-us.mchost.guru" // For generated images
      ],
      connectSrc: [
        "'self'",
        "http://localhost:8000", // GAN service
        "https://*.infura.io", // Ethereum RPC
        "https://*.alchemyapi.io", // Alternative RPC
        "https://ipfs.io", // IPFS gateway
        "https://gateway.pinata.cloud" // Pinata IPFS
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many API requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' // Skip health checks
    },
    
    // Art generation endpoint
    generation: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // limit each IP to 20 generations per hour
      message: 'Too many art generation requests from this IP',
      skipFailedRequests: false
    },
    
    // Minting endpoint
    minting: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // limit each IP to 5 mints per day
      message: 'Too many minting requests from this IP'
    },
    
    // IPFS upload endpoint
    ipfs: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // limit each IP to 50 uploads per hour
      message: 'Too many IPFS upload requests from this IP'
    }
  },

  // Input Validation Rules
  validation: {
    // Seed validation
    seed: {
      min: 0,
      max: 999999,
      type: 'integer'
    },
    
    // Color validation
    color: {
      pattern: /^#[0-9A-Fa-f]{6}$/,
      message: 'Color must be a valid hex color code'
    },
    
    // Size validation
    size: {
      min: 64,
      max: 2048,
      step: 64,
      default: 512
    },
    
    // Address validation
    address: {
      pattern: /^0x[a-fA-F0-9]{40}$/,
      message: 'Invalid Ethereum address format'
    },
    
    // IPFS hash validation
    ipfsHash: {
      pattern: /^[a-zA-Z0-9]{46}$/,
      message: 'Invalid IPFS hash format'
    }
  },

  // File Upload Security
  fileUpload: {
    // Maximum file size (10MB)
    maxSize: 10 * 1024 * 1024,
    
    // Allowed MIME types
    allowedTypes: [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    
    // Virus scanning (mock implementation)
    scanFiles: true,
    
    // Sanitize filenames
    sanitizeFilename: (filename: string) => {
      return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .toLowerCase()
        .substring(0, 100);
    }
  },

  // CORS Configuration
  cors: {
    // Allowed origins
    origins: [
      'http://localhost:5173', // Development
      'http://localhost:3000', // Alternative dev port
      'https://generative-art-gallery.vercel.app', // Production
      'https://*.vercel.app' // Vercel deployments
    ],
    
    // Allowed methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // Allowed headers
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key'
    ],
    
    // Credentials
    credentials: true,
    
    // Max age
    maxAge: 86400 // 24 hours
  },

  // API Key Management
  apiKeys: {
    // Rate limit for API key usage
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000 // 1000 requests per hour per API key
    },
    
    // Key rotation interval (30 days)
    rotationInterval: 30 * 24 * 60 * 60 * 1000,
    
    // Key format
    format: /^gan_[a-zA-Z0-9]{32}$/
  },

  // Web3 Security
  web3: {
    // Chain IDs for validation
    allowedChainIds: [1, 5, 11155111, 1337], // Mainnet, Goerli, Sepolia, Local
    
    // Contract address validation
    validateContractAddress: (address: string) => {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    },
    
    // Transaction validation
    validateTransaction: (tx: any) => {
      // Check gas limit
      if (tx.gasLimit && tx.gasLimit > 30000000) {
        throw new Error('Gas limit too high');
      }
      
      // Check value
      if (tx.value && tx.value > ethers.utils.parseEther('100')) {
        throw new Error('Transaction value too high');
      }
      
      return true;
    }
  },

  // Environment Variables Security
  envVars: {
    // Required environment variables
    required: [
      'VITE_ALCHEMY_API_KEY',
      'VITE_PINATA_JWT',
      'VITE_CONTRACT_ADDRESS'
    ],
    
    // Sensitive patterns to check for
    sensitivePatterns: [
      /private.*key/i,
      /secret.*key/i,
      /api.*key/i,
      /password/i,
      /mnemonic/i
    ]
  },

  // Logging Security
  logging: {
    // Sensitive data to redact
    redactPatterns: [
      /0x[a-fA-F0-9]{64}/g, // Private keys
      /gan_[a-zA-Z0-9]{32}/g, // API keys
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g // Credit cards
    ],
    
    // Log levels
    levels: ['error', 'warn', 'info'],
    
    // Maximum log file size (10MB)
    maxFileSize: 10 * 1024 * 1024,
    
    // Log retention (30 days)
    retention: 30 * 24 * 60 * 60 * 1000
  },

  // Error Handling
  errorHandling: {
    // Generic error messages for production
    genericMessages: {
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      429: 'Too many requests',
      500: 'Internal server error'
    },
    
    // Detailed errors in development only
    detailedErrors: process.env.NODE_ENV !== 'production',
    
    // Error logging
    logErrors: true,
    
    // Error reporting
    reportErrors: process.env.NODE_ENV === 'production'
  },

  // Security Headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
};

// Security utility functions
export const SecurityUtils = {
  // Sanitize input
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 1000); // Limit length
  },

  // Validate API key format
  validateApiKey: (apiKey: string): boolean => {
    return SecurityConfig.apiKeys.format.test(apiKey);
  },

  // Generate secure random ID
  generateSecureId: (): string => {
    return 'gan_' + Array.from({length: 32}, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      [Math.floor(Math.random() * 62)]
    ).join('');
  },

  // Redact sensitive data from logs
  redactSensitiveData: (data: string): string => {
    let redacted = data;
    SecurityConfig.logging.redactPatterns.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });
    return redacted;
  },

  // Validate file upload
  validateFileUpload: (file: File): { valid: boolean; error?: string } => {
    // Check size
    if (file.size > SecurityConfig.fileUpload.maxSize) {
      return { valid: false, error: 'File too large' };
    }
    
    // Check type
    if (!SecurityConfig.fileUpload.allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    return { valid: true };
  },

  // Rate limit key generator
  generateRateLimitKey: (identifier: string, type: string): string => {
    return `rate_limit:${type}:${identifier}`;
  }
};